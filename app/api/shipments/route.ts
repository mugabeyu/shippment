import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { mapShipment } from '@/lib/mappers';
import { requireActiveWorkSession } from '@/lib/workSession';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    let query = supabase()
      .from('shipments')
      .select('*, customer:customers(*), shipment_line_items(*)')
      .order('date', { ascending: false });

    if (status) query = query.eq('status', status);
    if (customerId) query = query.eq('customer_id', customerId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data.map(mapShipment));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const gate = await requireActiveWorkSession(req);
    if (gate instanceof NextResponse) return gate;

    const body = await req.json();
    const {
      customerId,
      routeDirection,
      description,
      status,
      date,
      paymentStatus,
      paymentMethod,
      pickupDate,
      expectedArrival,
      insurance,
      specialInstructions,
      internalNotes,
      photos,
      lineItems,
      initialPayment
    } = body;

    console.log('[DEBUG shipments POST] photos received:', JSON.stringify(photos), 'lineItems count:', Array.isArray(lineItems) ? lineItems.length : lineItems);

    // Validate line items
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 });
    }

    // None of these three depend on each other, so fetch/assign them concurrently
    // instead of one round trip at a time.
    const [trackingResult, offerResult, customerResult] = await Promise.all([
      supabase().rpc('next_tracking_number', { p_direction: routeDirection === 'retour' ? 'retour' : 'aller' }),
      supabase().from('offers').select('discount_percent, discount_amount, target_kg, reward_kg').eq('active', true).maybeSingle(),
      customerId ? supabase().from('customers').select('*').eq('id', customerId).single() : Promise.resolve({ data: null, error: null })
    ]);
    if (trackingResult.error) throw trackingResult.error;
    const tracking = trackingResult.data;
    const activeOffer = offerResult.data;
    const customer = customerResult.data as Record<string, any> | null;

    // Items are billed flat per item (unitPrice x quantity) unless they belong to the
    // "Kilograms" category (pricing_mode = 'per_kg'), which bills unitPrice x weightKg x
    // quantity — the same category flag is what makes Kilograms-only weight feed the
    // Offers/loyalty milestone math below.
    const shippingItemIds = Array.from(new Set(lineItems.map((li: any) => li.shippingItemId).filter(Boolean)));
    const { data: itemRows } = shippingItemIds.length
      ? await supabase().from('shipping_items').select('id, category:categories(pricing_mode)').in('id', shippingItemIds)
      : { data: [] as any[] };
    const pricingModeById = new Map(
      (itemRows || []).map((r: any) => [r.id, r.category?.pricing_mode === 'per_kg' ? 'per_kg' : 'per_item'])
    );
    const pricingModeFor = (li: any) => pricingModeById.get(li.shippingItemId) || 'per_item';

    // Weight can be fractional (e.g. 4.2kg), so the per-line total is rounded to whole
    // currency units before it's summed/stored — the currencies this app deals in
    // (MGA/Rs) don't have a usable subunit.
    let basePrice = 0;
    let perKgBasePrice = 0;
    const lineTotals: number[] = [];
    const lineWeights: (number | null)[] = [];
    for (const li of lineItems) {
      const unitPrice = Number(li.unitPrice) || 0;
      const qty = Math.max(0.01, Number(li.quantity) || 1);
      if (pricingModeFor(li) === 'per_kg') {
        const wkg = Math.max(1, Number(li.weightKg) || 1);
        lineWeights.push(wkg);
        const lineTotal = Math.round(unitPrice * qty * wkg);
        lineTotals.push(lineTotal);
        basePrice += lineTotal;
        perKgBasePrice += lineTotal;
      } else {
        lineWeights.push(null);
        const lineTotal = Math.round(unitPrice * qty);
        lineTotals.push(lineTotal);
        basePrice += lineTotal;
      }
    }

    // Discount logic
    let discountAmount = 0;
    if (activeOffer) {
      if (Number(activeOffer.discount_percent) > 0) {
        discountAmount = Math.round(basePrice * (Number(activeOffer.discount_percent) / 100));
      } else if (Number(activeOffer.discount_amount) > 0) {
        discountAmount = Number(activeOffer.discount_amount);
      }
    }

    // Total weight only from Kilograms-category (per_kg) line items — per-item lines
    // don't carry a billable weight, so they contribute 0 to the shipment/customer total.
    const totalWeight = lineItems.reduce((sum: number, li: any) => {
      if (pricingModeFor(li) !== 'per_kg') return sum;
      return sum + Math.max(1, Number(li.weightKg) || 1) * Math.max(0.01, Number(li.quantity) || 1);
    }, 0);

    const prevKg = customer?.total_kg_sent || 0;
    const newKg = prevKg + totalWeight;

    // Cumulative loyalty
    if (activeOffer && Number(activeOffer.target_kg) > 0 && Number(activeOffer.reward_kg) > 0 && customerId) {
      const target = Number(activeOffer.target_kg);
      const reward = Number(activeOffer.reward_kg);
      const milestonesBefore = Math.floor(prevKg / target);
      const milestonesAfter = Math.floor(newKg / target);
      const earned = Math.max(0, milestonesAfter - milestonesBefore);

      if (earned > 0) {
        const avgPricePerKg = Math.round(perKgBasePrice / Math.max(1, totalWeight));
        discountAmount += Math.round(reward * earned * avgPricePerKg);
      }
    }

    const finalAmount = Math.max(0, basePrice - discountAmount);
    // Deposit can't exceed what's actually owed.
    const initialPaymentAmount = Math.min(Math.max(0, Math.round(Number(initialPayment) || 0)), finalAmount);
    const normalizedPhotos = Array.isArray(photos) ? photos.slice(0, 3) : [];
    const origin = routeDirection === 'retour' ? 'Mauritius' : 'Madagascar';
    const destination = routeDirection === 'retour' ? 'Madagascar' : 'Mauritius';
    // Derive category from first line item for backward compat
    const category = lineItems[0]?.categoryName || lineItems[0]?.itemName || '';

    const { data: shipment, error: shipmentError } = await supabase()
      .from('shipments')
      .insert([{
        tracking_number: tracking,
        customer_id: customerId,
        origin,
        destination,
        category,
        weight_kg: totalWeight,
        quantity: lineItems.length,
        description,
        status: status || 'Pending',
        date: date || new Date().toISOString().split('T')[0],
        payment_status: paymentStatus || 'Unpaid',
        payment_method: paymentMethod,
        pickup_date: pickupDate || null,
        expected_arrival: expectedArrival || null,
        insurance: !!insurance,
        special_instructions: specialInstructions || '',
        internal_notes: internalNotes || '',
        photos: normalizedPhotos,
        base_price: basePrice,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        initial_payment: initialPaymentAmount,
        route_direction: routeDirection || null,
        created_by: gate.staff.id,
        work_session_id: gate.session.id
      }])
      .select()
      .single();

    if (shipmentError) throw shipmentError;

    // Insert line items
    const lineItemInserts = lineItems.map((li: any, idx: number) => ({
      shipment_id: shipment.id,
      shipping_item_id: li.shippingItemId || null,
      item_name: li.itemName,
      category_name: li.categoryName || null,
      quantity: Math.max(0.01, Number(li.quantity) || 1),
      weight_kg: lineWeights[idx],
      unit_price: Number(li.unitPrice) || 0,
      line_total: lineTotals[idx]
    }));

    const { data: insertedLineItems, error: lineError } = await supabase()
      .from('shipment_line_items')
      .insert(lineItemInserts)
      .select();

    if (lineError) {
      // Rollback: delete the shipment we just created
      await supabase().from('shipments').delete().eq('id', shipment.id);
      throw lineError;
    }

    logAudit(req, 'shipment_created', {
      id: shipment.id,
      trackingNumber: shipment.tracking_number,
      customerId,
      routeDirection,
      status: shipment.status,
      lineItems: lineItemInserts.length,
      totalWeight
    }, gate.staff);

    // customers.total_kg_sent is kept in sync by a DB trigger on the shipments
    // table (sync_customer_total_kg), so no manual write is needed here.

    // Build the response from data we already have in hand (the insert above already
    // returned the full shipment row, and the line-items insert returns its rows too)
    // instead of a fourth round trip to re-fetch what we just wrote.
    const created = {
      ...shipment,
      customer: customer ? { ...customer, total_kg_sent: newKg } : null,
      shipment_line_items: insertedLineItems || []
    };

    console.log('[DEBUG shipments POST] inserted shipment photos:', JSON.stringify(shipment.photos));

    return NextResponse.json(mapShipment(created), { status: 201 });
  } catch (error: any) {
    console.error('[DEBUG shipments POST] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
