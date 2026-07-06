import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, getAdminSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();
const adminSupabase = () => getAdminSupabase();

const STAFF_SELECT = 'id, name, email, role, phone, photo, department, active, invited_at, created_at, updated_at';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase()
      .from('staff')
      .select(STAFF_SELECT)
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
    const { name, email, role, phone, photo, department, active } = await req.json();
    const { data, error } = await supabase()
      .from('staff')
      .update({ name, email, role, phone, photo, department, active, updated_at: new Date() })
      .eq('id', id)
      .select(STAFF_SELECT)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: staff } = await supabase()
      .from('staff')
      .select('auth_uid, email')
      .eq('id', id)
      .single();
    const { error } = await supabase()
      .from('staff')
      .delete()
      .eq('id', id);
    if (error) throw error;
    if (staff?.auth_uid) {
      await adminSupabase().auth.admin.deleteUser(staff.auth_uid);
    }
    logAudit(req, 'staff_deleted', { id, email: staff?.email });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
