import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, getAdminSupabase } from '@/lib/supabase/server';
import { requireActiveWorkSession } from '@/lib/workSession';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();
const adminSupabase = () => getAdminSupabase();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireActiveWorkSession(req);
    if (gate instanceof NextResponse) return gate;

    const { id } = await params;
    const { data: staff, error: staffError } = await supabase()
      .from('staff')
      .select('email, active, auth_uid')
      .eq('id', id)
      .single();
    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }
    if (staff.active) {
      return NextResponse.json({ error: 'Staff member is already active' }, { status: 400 });
    }

    const origin = req.headers.get('origin')
      || (req.headers.get('referer')?.replace(/\/$/, '') ?? '')
      || '';
    const registerUrl = `${origin}/register?staffId=${id}`;

    const { data: inviteData, error: inviteError } = await adminSupabase().auth.admin.inviteUserByEmail(staff.email, {
      data: { staffId: id },
      redirectTo: registerUrl
    });
    if (inviteError) throw inviteError;

    if (inviteData?.user?.id && !staff.auth_uid) {
      await supabase()
        .from('staff')
        .update({ auth_uid: inviteData.user.id, invited_at: new Date() })
        .eq('id', id);
    }

    return NextResponse.json({ message: 'Invitation resent successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
