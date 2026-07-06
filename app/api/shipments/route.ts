import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    let query = supabase()
      .from('shipments')
      .select('*, customer:customers(*)')
      .order('date', { ascending: false });

    if (status) query = query.eq('status', status);
    if (customerId) query = query.eq('customer_id', customerId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerId, origin, destination, category, weightKg, quantity, description, status,
      date, paymentStatus, paymentMethod, trackingNumber, pickupDate, expectedArrival,
      insurance, specialInstructions, internalNotes, photos
    } = body;

    const tracking = trackingNumber || `TRK-${Math.floor(1000 + Math.random() * 9000)}`;

    let basePrice = 0;
    const { data: categoryRow } = await supabase()
      .from('categories')
      .select('price_per_kg')
      .eq('name', category)
      .single();

    if (categoryRow?.price_per_kg) {
      basePrice = Number(categoryRow.price_per_kg) * (weightKg || 0) * (quantity || 1);
    } else {
      const { data: settingsRow } = await supabase()
        .from('settings')
        .select('default_rate_per_kg')
        .single();
      const defaultRate = settingsRow?.default_rate_per_kg || 0;
      basePrice = defaultRate * (weightKg || 0) * (quantity || 1);
    }

    let discountAmount = 0;
    const { data: activeOffer } = await supabase()
      .from('offers')
      .select('discount_percent, discount_amount')
      .eq('active', true)
      .maybeSingle();

    if (activeOffer) {
      if (Number(activeOffer.discount_percent) > 0) {
        discountAmount = Math.round(basePrice * (Number(activeOffer.discount_percent) / 100));
      } else if (Number(activeOffer.discount_amount) > 0) {
        discountAmount = Number(activeOffer.discount_amount);
      }
    }

    const finalAmount = Math.max(0, basePrice - discountAmount);
    const normalizedPhotos = Array.isArray(photos) ? photos.slice(0, 3) : [];

    const { data: shipment, error: shipmentError } = await supabase()
      .from('shipments')
      .insert([{
        tracking_number: tracking,
        customer_id: customerId,
        origin,
        destination,
        category,
        weight_kg: weightKg,
        quantity,
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
        final_amount: finalAmount
      }])
      .select('*, customer:customers(*)')
      .single();

    if (shipmentError) throw shipmentError;

    const { data: customer } = await supabase()
      .from('customers')
      .select('total_kg_sent')
      .eq('id', customerId)
      .single();

    if (customer) {
      await supabase()
        .from('customers')
        .update({ total_kg_sent: (customer.total_kg_sent || 0) + weightKg })
        .eq('id', customerId);
    }

    return NextResponse.json(shipment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
