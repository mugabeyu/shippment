import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { mapShipment } from '@/lib/mappers';

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
    const body = await req.json();
    const {
      customerId,
      routeDirection,
      description,
      status,
      date,
      paymentStatus,
      paymentMethod,
      trackingNumber,
      pickupDate,
      expectedArrival,
      insurance,
      specialInstructions,
      internalNotes,
      photos,
      lineItems
    } = body;

    const tracking = trackingNumber || `TRK-${Math.floor(1000 + Math.random() * 9000)}`;

    // Validate line items
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 });
    }

    // Compute pricing from line items
    let basePrice = 0;
    for (const li of lineItems) {
      const unitPrice = Number(li.unitPrice) || 0;
      const qty = Math.max(1, Number(li.quantity) || 1);
      const wkg = Math.max(1, Number(li.weightKg) || 1);
      basePrice += unitPrice * qty * wkg;
    }

    // Discount logic
    let discountAmount = 0;
    const { data: activeOffer } = await supabase()
      .from('offers')
      .select('discount_percent, discount_amount, target_kg, reward_kg')
      .eq('active', true)
      .maybeSingle();

    if (activeOffer) {
      if (Number(activeOffer.discount_percent) > 0) {
        discountAmount = Math.round(basePrice * (Number(activeOffer.discount_percent) / 100));
      } else if (Number(activeOffer.discount_amount) > 0) {
        discountAmount = Number(activeOffer.discount_amount);
      }
    }

    // Total weight from all line items
    const totalWeight = lineItems.reduce((sum: number, li: any) => {
      return sum + (Number(li.weightKg) || 1) * (Number(li.quantity) || 1);
    }, 0);

    // Cumulative loyalty
    if (activeOffer && Number(activeOffer.target_kg) > 0 && Number(activeOffer.reward_kg) > 0 && customerId) {
      const { data: customerData } = await supabase()
        .from('customers')
        .select('total_kg_sent')
        .eq('id', customerId)
        .single();

      const prevKg = customerData?.total_kg_sent || 0;
      const newKg = prevKg + totalWeight;
      const target = Number(activeOffer.target_kg);
      const reward = Number(activeOffer.reward_kg);
      const milestonesBefore = Math.floor(prevKg / target);
      const milestonesAfter = Math.floor(newKg / target);
      const earned = Math.max(0, milestonesAfter - milestonesBefore);

      if (earned > 0) {
        const avgPricePerKg = Math.round(basePrice / Math.max(1, totalWeight));
        discountAmount += Math.round(reward * earned * avgPricePerKg);
      }
    }

    const finalAmount = Math.max(0, basePrice - discountAmount);
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
        route_direction: routeDirection || null
      }])
      .select()
      .single();

    if (shipmentError) throw shipmentError;

    // Insert line items
    const lineItemInserts = lineItems.map((li: any) => ({
      shipment_id: shipment.id,
      shipping_item_id: li.shippingItemId || null,
      item_name: li.itemName,
      category_name: li.categoryName || null,
      quantity: Math.max(1, Number(li.quantity) || 1),
      weight_kg: Math.max(1, Number(li.weightKg) || 1),
      unit_price: Number(li.unitPrice) || 0,
      line_total: (Number(li.unitPrice) || 0) * Math.max(1, Number(li.quantity) || 1) * Math.max(1, Number(li.weightKg) || 1)
    }));

    const { error: lineError } = await supabase()
      .from('shipment_line_items')
      .insert(lineItemInserts);

    if (lineError) {
      // Rollback: delete the shipment we just created
      await supabase().from('shipments').delete().eq('id', shipment.id);
      throw lineError;
    }

    logAudit(req, 'shipment_created', {
      trackingNumber: shipment.tracking_number,
      customerId,
      routeDirection,
      status: shipment.status,
      lineItems: lineItemInserts.length,
      totalWeight
    });

    // Update customer total kg
    if (customerId) {
      const { data: customer } = await supabase()
        .from('customers')
        .select('total_kg_sent')
        .eq('id', customerId)
        .single();

      if (customer) {
        await supabase()
          .from('customers')
          .update({ total_kg_sent: (customer.total_kg_sent || 0) + totalWeight })
          .eq('id', customerId);
      }
    }

    // Fetch back with line items
    const { data: created } = await supabase()
      .from('shipments')
      .select('*, customer:customers(*), shipment_line_items(*)')
      .eq('id', shipment.id)
      .single();

    return NextResponse.json(mapShipment(created), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
