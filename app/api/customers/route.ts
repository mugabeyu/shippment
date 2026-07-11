import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { friendlyDbError } from '@/lib/dbErrors';
import { requireActiveWorkSession } from '@/lib/workSession';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function GET() {
  try {
    const { data, error } = await supabase()
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const gate = await requireActiveWorkSession(req);
    if (gate instanceof NextResponse) return gate;

    const { name, phone, email, address, notes, photo, active } = await req.json();
    const insertData: Record<string, any> = { name, phone, email, address, notes, photo, total_kg_sent: 0 };
    if (active !== undefined) insertData.active = active;

    const { data, error } = await supabase()
      .from('customers')
      .insert([insertData])
      .select()
      .single();
    if (error) throw error;
    logAudit(req, 'customer_created', { id: data.id, name, phone, email });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    const { message, status } = friendlyDbError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
