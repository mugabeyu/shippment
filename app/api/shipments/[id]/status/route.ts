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
    const { data, error } = await supabase()
      .from('shipments')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select('*, customer:customers(*)')
      .single();
    if (error) throw error;
    logAudit(req, 'shipment_status_changed', {
      id: data.id,
      trackingNumber: data.tracking_number,
      status
    });
    return NextResponse.json(mapShipment(data));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
