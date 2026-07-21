import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { getActingStaff, logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

// Always ends the caller's own open session — there's no id in the URL, so
// there's no way to accidentally (or maliciously) end someone else's session.
export async function POST(req: NextRequest) {
  try {
    const staff = await getActingStaff(req);
    if (!staff || !staff.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Single conditional update instead of a SELECT to find the open session
    // followed by an UPDATE by id — the WHERE clause (staff_id + ended_at IS
    // NULL) already pins it to at most one row, so there's nothing the
    // pre-check SELECT told us that this can't check itself.
    const { data, error } = await supabase()
      .from('staff_work_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('staff_id', staff.id)
      .is('ended_at', null)
      .select('*, staff:staff(name, email)')
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'No work session in progress.' }, { status: 404 });
    }

    logAudit(req, 'work_session_ended', { staffId: staff.id, sessionId: data.id }, staff);
    return NextResponse.json({
      id: data.id,
      staffId: data.staff_id,
      staffName: data.staff?.name ?? null,
      staffEmail: data.staff?.email ?? null,
      startedAt: data.started_at,
      endedAt: data.ended_at,
      createdAt: data.created_at,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
