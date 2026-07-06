import { getServiceSupabase } from './supabase/server';

export interface AuthUser {
  id: string;
  email: string;
  role: 'Admin' | 'Staff';
  name: string;
  active: boolean;
  staffId: string;
}

/**
 * Resolves the currently authenticated staff member from a Supabase session token.
 * Used by middleware and server components for session checks.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('id, name, email, role, phone, photo, active')
    .eq('auth_uid', data.user.id)
    .single();

  if (staffError || !staff || !staff.active) return null;

  return {
    id: data.user.id,
    email: staff.email,
    role: staff.role,
    name: staff.name,
    active: staff.active,
    staffId: staff.id,
  };
}
