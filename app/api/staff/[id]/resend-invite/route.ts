import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, getAdminSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();
const adminSupabase = () => getAdminSupabase();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: staff, error: staffError } = await supabase()
      .from('staff')
      .select('email, active')
      .eq('id', id)
      .single();
    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }
    if (staff.active) {
      return NextResponse.json({ error: 'Staff member is already active' }, { status: 400 });
    }
    const { error: inviteError } = await adminSupabase().auth.admin.inviteUserByEmail(staff.email, {
      data: { staffId: id }
    });
    if (inviteError) throw inviteError;
    return NextResponse.json({ message: 'Invitation resent successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
