import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getServiceSupabase } from './supabase/server';

/**
 * Resolves the staff member performing the current request from the Supabase
 * session cookie (same mechanism the auth middleware in proxy.ts uses).
 * Returns null when there is no authenticated session.
 */
async function getActingStaff(req: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll() {
            // Read-only here; route handlers must not set auth cookies.
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: staff } = await getServiceSupabase()
      .from('staff')
      .select('id, name, email')
      .eq('auth_uid', user.id)
      .maybeSingle();

    return staff ?? { id: null, name: user.email ?? 'Unknown', email: user.email ?? 'Unknown' };
  } catch {
    return null;
  }
}

/**
 * Records an audit log entry for an action performed through the app.
 * Failures are swallowed so audit logging never breaks the main operation.
 */
export async function logAudit(req: NextRequest, action: string, details: Record<string, any> = {}) {
  try {
    const staff = await getActingStaff(req);
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null;

    await getServiceSupabase()
      .from('audit_logs')
      .insert([
        {
          action,
          details,
          staff_id: staff?.id ?? null,
          staff_name: staff?.name ?? null,
          staff_email: staff?.email ?? null,
          ip_address: ip,
        },
      ]);
  } catch {
    // Never let audit logging break the originating request.
  }
}
