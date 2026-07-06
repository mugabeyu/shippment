import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const staffId = searchParams.get('staffId');
    const limit = Number(searchParams.get('limit') || 100);
    const offset = Number(searchParams.get('offset') || 0);

    let query = supabase()
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) query = query.eq('action', action);
    if (staffId) query = query.eq('staff_id', staffId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, details, staffId, staffName, staffEmail, ipAddress } = await req.json();
    const { data, error } = await supabase()
      .from('audit_logs')
      .insert([{ action, details, staff_id: staffId, staff_name: staffName, staff_email: staffEmail, ip_address: ipAddress }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
