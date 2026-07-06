import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase()
      .from('shipments')
      .select('*, customer:customers(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      customerId, origin, destination, category, weightKg = 0, quantity = 1, description,
      status, date, paymentStatus, paymentMethod, receiptSent, pickupDate, expectedArrival,
      insurance, specialInstructions, internalNotes, photos
    } = body;
    const normalizedPhotos = Array.isArray(photos) ? photos.slice(0, 3) : [];

    const { data: oldShipment } = await supabase()
      .from('shipments')
      .select('weight_kg, customer_id')
      .eq('id', id)
      .single();

    const { data, error } = await supabase()
      .from('shipments')
      .update({
        customer_id: customerId,
        origin,
        destination,
        category,
        weight_kg: weightKg,
        quantity,
        description,
        status,
        date,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        receipt_sent: receiptSent,
        pickup_date: pickupDate || null,
        expected_arrival: expectedArrival || null,
        insurance: !!insurance,
        special_instructions: specialInstructions || '',
        internal_notes: internalNotes || '',
        photos: normalizedPhotos,
        updated_at: new Date()
      })
      .eq('id', id)
      .select('*, customer:customers(*)')
      .single();

    if (error) throw error;

    if (oldShipment && customerId !== oldShipment.customer_id) {
      const { data: oldCustomer } = await supabase()
        .from('customers')
        .select('total_kg_sent')
        .eq('id', oldShipment.customer_id)
        .single();
      if (oldCustomer) {
        await supabase()
          .from('customers')
          .update({ total_kg_sent: Math.max(0, (oldCustomer.total_kg_sent || 0) - (oldShipment.weight_kg || 0)) })
          .eq('id', oldShipment.customer_id);
      }
      const { data: newCustomer } = await supabase()
        .from('customers')
        .select('total_kg_sent')
        .eq('id', customerId)
        .single();
      if (newCustomer) {
        await supabase()
          .from('customers')
          .update({ total_kg_sent: (newCustomer.total_kg_sent || 0) + weightKg })
          .eq('id', customerId);
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: shipment } = await supabase()
      .from('shipments')
      .select('weight_kg, customer_id')
      .eq('id', id)
      .single();

    const { error } = await supabase()
      .from('shipments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (shipment) {
      const { data: customer } = await supabase()
        .from('customers')
        .select('total_kg_sent')
        .eq('id', shipment.customer_id)
        .single();
      if (customer) {
        await supabase()
          .from('customers')
          .update({ total_kg_sent: Math.max(0, (customer.total_kg_sent || 0) - (shipment.weight_kg || 0)) })
          .eq('id', shipment.customer_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
