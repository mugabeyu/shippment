import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { getActingStaff, logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

const mapSession = (row: any) => ({
  id: row.id,
  staffId: row.staff_id,
  staffName: row.staff?.name ?? null,
  staffEmail: row.staff?.email ?? null,
  startedAt: row.started_at,
  endedAt: row.ended_at,
  createdAt: row.created_at,
});

export async function GET() {
  try {
    const { data, error } = await supabase()
      .from('staff_work_sessions')
      .select('*, staff:staff(name, email)')
      .order('started_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json((data || []).map(mapSession));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const staff = await getActingStaff(req);
    if (!staff || !staff.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // No pre-check SELECT: idx_work_sessions_one_open_per_staff (a partial
    // unique index on staff_id WHERE ended_at IS NULL) already enforces
    // "one open session per staff" at the DB level, so we can go straight to
    // the insert and only pay for a second round trip on the rare conflict.
    const { data, error } = await supabase()
      .from('staff_work_sessions')
      .insert([{ staff_id: staff.id }])
      .select('*, staff:staff(name, email)')
      .single();
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'You already have a work session in progress.' }, { status: 409 });
      }
      throw error;
    }

    logAudit(req, 'work_session_started', { staffId: staff.id }, staff);
    return NextResponse.json(mapSession(data), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
