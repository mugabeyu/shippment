import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, getAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();
const adminSupabase = () => getAdminSupabase();

const STAFF_SELECT = 'id, name, email, role, phone, photo, active, invited_at, created_at, updated_at';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, phone, photo, authUid } = await req.json();
    const updateData: any = { name, phone, photo, active: true };
    if (authUid) updateData.auth_uid = authUid;
    const { data, error } = await supabase()
      .from('staff')
      .update(updateData)
      .eq('id', id)
      .select(STAFF_SELECT)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
