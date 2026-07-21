import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { getActingStaff } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

const mapSession = (row: any) => ({
  id: row.id,
  staffId: row.staff_id,
  startedAt: row.started_at,
  endedAt: row.ended_at,
  createdAt: row.created_at,
});

// The caller's own open work session, resolved from the auth cookie (staff_id)
// rather than a client-cached email — localStorage's activeStaffEmail can go
// stale relative to the staff table (e.g. after an admin edits the record),
// which used to make the topbar button say "Start Work" while the server
// still had an open session, so every click 409'd with no way to recover.
export async function GET(req: NextRequest) {
  try {
    const staff = await getActingStaff(req);
    if (!staff || !staff.id) {
      return NextResponse.json(null);
    }

    const { data, error } = await supabase()
      .from('staff_work_sessions')
      .select('*')
      .eq('staff_id', staff.id)
      .is('ended_at', null)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json(data ? mapSession(data) : null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
