import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, getAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();
const adminSupabase = () => getAdminSupabase();

const STAFF_SELECT = 'id, name, email, role, phone, photo, active, invited_at, created_at, updated_at';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { password, name, phone, photo } = await req.json();
    if (!password || !name || !phone) {
      return NextResponse.json({ error: 'Password, name, and phone are required' }, { status: 400 });
    }

    const { data: staff, error: staffError } = await supabase()
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();
    if (staffError || !staff) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }
    if (staff.active) {
      return NextResponse.json({ error: 'This invitation has already been accepted' }, { status: 400 });
    }

    const { data: authData, error: authError } = await adminSupabase().auth.admin.createUser({
      email: staff.email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, role: staff.role, staffId: staff.id }
    });
    if (authError) throw authError;

    const { data: updated, error: updateError } = await supabase()
      .from('staff')
      .update({
        name,
        phone,
        photo: photo || '',
        active: true,
        auth_uid: authData.user.id,
        updated_at: new Date()
      })
      .eq('id', id)
      .select(STAFF_SELECT)
      .single();
    if (updateError) throw updateError;

    return NextResponse.json(updated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
