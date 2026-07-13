import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { mapShipment } from '@/lib/mappers';
import { requireActiveWorkSession } from '@/lib/workSession';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireActiveWorkSession(req);
    if (gate instanceof NextResponse) return gate;

    const { id } = await params;
    const { status } = await req.json();

    const updatePayload: Record<string, any> = { status, updated_at: new Date() };

    // Delivery implies the customer has settled up: flip payment_status to
    // Paid and clear any outstanding balance so revenue/balance figures
    // don't lag behind the delivered state.
    if (status === 'Delivered') {
      const { data: existing, error: fetchError } = await supabase()
        .from('shipments')
        .select('final_amount, initial_payment')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      updatePayload.payment_status = 'Paid';
      if ((existing.initial_payment ?? 0) < (existing.final_amount ?? 0)) {
        updatePayload.initial_payment = existing.final_amount;
      }
    }

    const { data, error } = await supabase()
      .from('shipments')
      .update(updatePayload)
      .eq('id', id)
      .select('*, customer:customers(*)')
      .single();
    if (error) throw error;
    logAudit(req, 'shipment_status_changed', {
      id: data.id,
      trackingNumber: data.tracking_number,
      status,
      paymentStatus: data.payment_status
    });
    return NextResponse.json(mapShipment(data));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
