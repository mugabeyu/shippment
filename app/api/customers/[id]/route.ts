import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { friendlyDbError } from '@/lib/dbErrors';
import { requireActiveWorkSession } from '@/lib/workSession';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase()
      .from('customers')
      .select('*')
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
    const gate = await requireActiveWorkSession(req);
    if (gate instanceof NextResponse) return gate;

    const { id } = await params;
    const body = await req.json();
    const updateData: Record<string, any> = { updated_at: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.photo !== undefined) updateData.photo = body.photo;
    if (body.total_kg_sent !== undefined) updateData.total_kg_sent = body.total_kg_sent;
    if (body.active !== undefined) updateData.active = body.active;

    const { data, error } = await supabase()
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    logAudit(req, 'customer_updated', { id, name: body.name, phone: body.phone, email: body.email, active: body.active }, gate.staff);
    return NextResponse.json(data);
  } catch (error: any) {
    const { message, status } = friendlyDbError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

