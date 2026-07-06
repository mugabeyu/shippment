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

export async function GET() {
  try {
    const { data, error } = await supabase()
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data.map(mapOffer));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, targetKg, rewardKg, discountPercent, discountAmount, active } = await req.json();
    const { data, error } = await supabase()
      .from('offers')
      .insert([{ name, target_kg: targetKg, reward_kg: rewardKg, discount_percent: discountPercent ?? 0, discount_amount: discountAmount ?? 0, active }])
      .select()
      .single();
    if (error) throw error;
    logAudit(req, 'offer_created', { name, discountPercent, discountAmount, active });
    return NextResponse.json(mapOffer(data), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
