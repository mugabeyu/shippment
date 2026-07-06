import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, getAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();
const adminSupabase = () => getAdminSupabase();

const STAFF_SELECT = 'id, name, email, role, phone, photo, active, invited_at, created_at, updated_at';

export async function GET() {
  try {
    const { data, error } = await supabase()
      .from('staff')
      .select(STAFF_SELECT)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json();
    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    const { data: existing } = await supabase()
      .from('staff')
      .select('id, active')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Staff member with this email already exists' }, { status: 409 });
    }

    const { data: staff, error: staffError } = await supabase()
      .from('staff')
      .insert([{ email, role, active: false, name: '', phone: '' }])
      .select(STAFF_SELECT)
      .single();
    if (staffError) throw staffError;

    const { error: inviteError } = await adminSupabase().auth.admin.inviteUserByEmail(email, {
      data: { role, staffId: staff.id }
    });
    if (inviteError) {
      await supabase().from('staff').delete().eq('id', staff.id);
      throw inviteError;
    }

    return NextResponse.json({ ...staff, message: 'Invitation sent successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
