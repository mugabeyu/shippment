import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const read = searchParams.get('read');
    const staffId = searchParams.get('staffId');
    const limit = Number(searchParams.get('limit') || 50);
    const offset = Number(searchParams.get('offset') || 0);

    let query = supabase()
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (read !== null) query = query.eq('read', read === 'true');
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
    const { type, title, message, staffId, referenceId, referenceType } = await req.json();
    const { data, error } = await supabase()
      .from('notifications')
      .insert([{ type, title, message, staff_id: staffId, reference_id: referenceId, reference_type: referenceType }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
