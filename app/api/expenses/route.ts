import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { requireActiveWorkSession } from '@/lib/workSession';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function GET() {
  try {
    const { data, error } = await supabase()
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data.map(mapExpense));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function mapExpense(row: any) {
  return {
    id: row.id,
    date: row.date,
    category: row.category,
    amount: row.amount,
    note: row.note ?? '',
    attachmentUrl: row.attachment_url ?? null,
    createdBy: row.created_by ?? null,
    workSessionId: row.work_session_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function POST(req: NextRequest) {
  try {
    const gate = await requireActiveWorkSession(req);
    if (gate instanceof NextResponse) return gate;

    const { date, category, amount, note, attachmentUrl } = await req.json();
    const { data, error } = await supabase()
      .from('expenses')
      .insert([{
        date: date || new Date().toISOString().split('T')[0],
        category,
        amount,
        note: note || '',
        attachment_url: attachmentUrl || null,
        created_by: gate.staff.id,
        work_session_id: gate.session.id
      }])
      .select()
      .single();

    if (error) throw error;
    logAudit(req, 'expense_created', { category, amount, note });
    return NextResponse.json(mapExpense(data), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
