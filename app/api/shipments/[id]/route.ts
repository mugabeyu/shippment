import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { mapShipment } from '@/lib/mappers';
import { requireActiveWorkSession } from '@/lib/workSession';

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
    return NextResponse.json(mapShipment(data));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireActiveWorkSession(req);
    if (gate instanceof NextResponse) return gate;

    const { id } = await params;
    const body = await req.json();
    const {
      customerId, origin, destination, category, weightKg = 0, quantity = 1, description,
      status, date, paymentStatus, paymentMethod, receiptSent, pickupDate, expectedArrival,
      insurance, specialInstructions, internalNotes, photos
    } = body;
    const normalizedPhotos = Array.isArray(photos) ? photos.slice(0, 3) : [];

    // Delivery or an explicit Paid mark both mean the balance is settled —
    // keep payment_status/initial_payment consistent regardless of which
    // field triggered it, so revenue/balance figures never lag behind.
    const isPaid = paymentStatus === 'Paid' || status === 'Delivered';
    let initialPaymentUpdate: number | undefined;
    if (isPaid) {
      const { data: existing, error: fetchError } = await supabase()
        .from('shipments')
        .select('final_amount, initial_payment')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;
      if ((existing.initial_payment ?? 0) < (existing.final_amount ?? 0)) {
        initialPaymentUpdate = existing.final_amount;
      }
    }

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
        payment_status: isPaid ? 'Paid' : paymentStatus,
        payment_method: paymentMethod,
        receipt_sent: receiptSent,
        pickup_date: pickupDate || null,
        expected_arrival: expectedArrival || null,
        insurance: !!insurance,
        special_instructions: specialInstructions || '',
        internal_notes: internalNotes || '',
        photos: normalizedPhotos,
        ...(initialPaymentUpdate !== undefined ? { initial_payment: initialPaymentUpdate } : {}),
        updated_at: new Date()
      })
      .eq('id', id)
      .select('*, customer:customers(*)')
      .single();

    if (error) throw error;

    logAudit(req, 'shipment_updated', {
      id: data.id,
      trackingNumber: data.tracking_number,
      customerId,
      status,
      changes: Object.keys(body)
    }, gate.staff);

    // customers.total_kg_sent is kept in sync by a DB trigger on the shipments
    // table (sync_customer_total_kg), which recomputes both the old and new
    // customer's totals whenever weight_kg or customer_id changes.

    return NextResponse.json(mapShipment(data));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireActiveWorkSession(req);
    if (gate instanceof NextResponse) return gate;

    const { id } = await params;
    const { data: shipment } = await supabase()
      .from('shipments')
      .select('tracking_number, weight_kg, customer_id')
      .eq('id', id)
      .single();

    const { error } = await supabase()
      .from('shipments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    logAudit(req, 'shipment_deleted', {
      trackingNumber: shipment?.tracking_number,
      customerId: shipment?.customer_id,
      weightKg: shipment?.weight_kg
    }, gate.staff);

    // customers.total_kg_sent is kept in sync by a DB trigger on the shipments
    // table (sync_customer_total_kg), so no manual decrement is needed here.

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
