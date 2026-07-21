import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, getAdminSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { requireActiveWorkSession } from '@/lib/workSession';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();
const adminSupabase = () => getAdminSupabase();

const STAFF_SELECT = 'id, name, email, role, phone, photo, department, active, invited_at, created_at, updated_at';

async function getCurrentStaff() {
  const cookieStore = await cookies();
  const userSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    }
  );
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase()
    .from('staff')
    .select('role, id')
    .eq('auth_uid', user.id)
    .single();
  return data;
}

async function requireAdmin() {
  const requester = await getCurrentStaff();
  if (!requester) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (requester.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }
  return null;
}

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
    const gate = await requireActiveWorkSession(req);
    if (gate instanceof NextResponse) return gate;

    const { id } = await params;
    const body = await req.json();
    const updateData: Record<string, any> = { updated_at: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.photo !== undefined) updateData.photo = body.photo;
    if (body.department !== undefined) updateData.department = body.department;

    const isAdminChange = body.active !== undefined || body.role !== undefined;
    if (isAdminChange) {
      const adminError = await requireAdmin();
      if (adminError) return adminError;
      const requester = await getCurrentStaff();
      // A staff member can never block (deactivate) their own account.
      if (body.active === false && requester && requester.id === id) {
        return NextResponse.json({ error: 'You cannot block your own account.' }, { status: 403 });
      }
      if (body.active !== undefined) updateData.active = body.active;
      if (body.role !== undefined) updateData.role = body.role;
    }

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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminError = await requireAdmin();
    if (adminError) return adminError;
    const gate = await requireActiveWorkSession(req);
    if (gate instanceof NextResponse) return gate;

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
    logAudit(req, 'staff_deleted', { id, email: staff?.email }, gate.staff);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
