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

    const userMetadata = { name, phone, role: staff.role, staffId: staff.id };

    // The invitation email (inviteUserByEmail) already created the auth user and
    // stored its id on the staff row. Reuse it so the staff member ends up with a
    // working email + password to log in, instead of failing on a duplicate email.
    let authUserId: string;
    if (staff.auth_uid) {
      const { data: updatedUser, error: updateError } = await adminSupabase()
        .auth.admin.updateUserById(staff.auth_uid, {
          password,
          email_confirm: true,
          user_metadata: userMetadata
        });
      if (updateError) throw updateError;
      authUserId = updatedUser.user.id;
    } else {
      const { data: authData, error: authError } = await adminSupabase().auth.admin.createUser({
        email: staff.email,
        password,
        email_confirm: true,
        user_metadata: userMetadata
      });
      if (authError) throw authError;
      authUserId = authData.user.id;
    }

    const { data: updated, error: updateError } = await supabase()
      .from('staff')
      .update({
        name,
        phone,
        photo: photo || '',
        active: true,
        auth_uid: authUserId,
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
