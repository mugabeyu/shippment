import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServiceSupabase } from './supabase/server';
import { getActingStaff } from './audit';

/**
 * Enforces that the staff member performing this request has an open work
 * session (started via the topbar "Start Work" button, not yet ended). Every
 * mutating API route calls this first — call sites just do:
 *
 *   const gate = await requireActiveWorkSession(req);
 *   if (gate instanceof NextResponse) return gate;
 *   const { staff, session } = gate;
 *
 * Returning the resolved staff/session lets callers stamp created_by /
 * work_session_id on the row they're about to insert.
 */
export async function requireActiveWorkSession(
  req: NextRequest
): Promise<NextResponse | { staff: { id: string; name: string; email: string }; session: { id: string; started_at: string } }> {
  const staff = await getActingStaff(req);
  if (!staff || !staff.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: session } = await getServiceSupabase()
    .from('staff_work_sessions')
    .select('id, started_at')
    .eq('staff_id', staff.id)
    .is('ended_at', null)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: 'Start your work session before making changes.' }, { status: 403 });
  }

  return { staff: staff as { id: string; name: string; email: string }, session };
}
