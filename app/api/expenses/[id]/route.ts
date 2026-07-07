import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

function mapExpense(row: any) {
  return {
    id: row.id,
    date: row.date,
    category: row.category,
    amount: row.amount,
    note: row.note ?? '',
    attachmentUrl: row.attachment_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase()
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return NextResponse.json(mapExpense(data));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { date, category, amount, note, attachmentUrl } = await req.json();
    const { data, error } = await supabase()
      .from('expenses')
      .update({ date, category, amount, note: note || '', attachment_url: attachmentUrl || null, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    logAudit(req, 'expense_updated', { id, category, amount });
    return NextResponse.json(mapExpense(data));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabase()
      .from('expenses')
      .delete()
      .eq('id', id);
    if (error) throw error;
    logAudit(req, 'expense_deleted', { id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
