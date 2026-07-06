import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

const mapOffer = (row: any) => ({
  id: row.id,
  name: row.name,
  targetKg: row.target_kg ?? 0,
  rewardKg: row.reward_kg ?? 0,
  discountPercent: row.discount_percent ?? 0,
  discountAmount: row.discount_amount ?? 0,
  active: row.active ?? false,
  createdAt: row.created_at
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase()
      .from('offers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return NextResponse.json(mapOffer(data));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, targetKg, rewardKg, discountPercent, discountAmount, active } = await req.json();
    const { data, error } = await supabase()
      .from('offers')
      .update({ name, target_kg: targetKg, reward_kg: rewardKg, discount_percent: discountPercent ?? 0, discount_amount: discountAmount ?? 0, active, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    logAudit(req, 'offer_updated', { id, name, active });
    return NextResponse.json(mapOffer(data));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabase()
      .from('offers')
      .delete()
      .eq('id', id);
    if (error) throw error;
    logAudit(req, 'offer_deleted', { id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
