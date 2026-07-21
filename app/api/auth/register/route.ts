import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase, getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const admin = getAdminSupabase();
    const service = getServiceSupabase();

    const { data: existingStaff } = await service
      .from('staff')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingStaff) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message || 'Failed to create auth user' }, { status: 400 });
    }

    const { data: staff, error: staffError } = await service
      .from('staff')
      .insert([{
        name,
        email,
        role: 'Staff',
        phone,
        active: false,
        auth_uid: authData.user.id
      }])
      .select('id, name, email, role, phone, photo, active, invited_at, created_at, updated_at')
      .single();

    if (staffError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: staffError.message || 'Failed to create staff record' }, { status: 500 });
    }

    logAudit(req, 'staff_self_registered', { email, role: 'Staff', staffId: staff.id }, staff);

    return NextResponse.json({ ...staff, message: 'Registration successful. Your account is pending approval.' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
