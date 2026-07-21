import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, getAdminSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { requireActiveWorkSession } from '@/lib/workSession';

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
    const gate = await requireActiveWorkSession(req);
    if (gate instanceof NextResponse) return gate;

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

    const origin = req.headers.get('origin')
      || (req.headers.get('referer')?.replace(/\/$/, '') ?? '')
      || '';
    const registerUrl = `${origin}/register?staffId=${staff.id}`;

    const { data: inviteData, error: inviteError } = await adminSupabase().auth.admin.inviteUserByEmail(email, {
      data: { role, staffId: staff.id },
      redirectTo: registerUrl
    });
    if (inviteError) {
      await supabase().from('staff').delete().eq('id', staff.id);
      throw inviteError;
    }

    // Persist the auth user id so registration can reuse (not duplicate) it.
    if (inviteData?.user?.id) {
      await supabase()
        .from('staff')
        .update({ auth_uid: inviteData.user.id, invited_at: new Date() })
        .eq('id', staff.id);
    }

    logAudit(req, 'staff_invited', { email, role, staffId: staff.id }, gate.staff);

    return NextResponse.json({ ...staff, message: 'Invitation sent successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
