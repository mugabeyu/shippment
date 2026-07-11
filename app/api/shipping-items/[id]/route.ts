import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { requireActiveWorkSession } from '@/lib/workSession';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

const mapItem = (row: any) => ({
  id: row.id,
  categoryId: row.category_id,
  categoryName: row.category?.name ?? row.category_name ?? null,
  categoryPricingMode: row.category?.pricing_mode || 'per_item',
  item: row.item,
  allerPrice: row.aller_price ?? 0,
  retourPrice: row.retour_price ?? null,
  active: row.active ?? true,
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireActiveWorkSession(req);
    if (gate instanceof NextResponse) return gate;

    const { id } = await params;
    const { categoryId, item, allerPrice, retourPrice, active } = await req.json();

    const updates: Record<string, any> = { updated_at: new Date() };
    if (categoryId !== undefined) updates.category_id = categoryId;
    if (item !== undefined) updates.item = item;
    if (allerPrice !== undefined) updates.aller_price = allerPrice;
    if (retourPrice !== undefined) updates.retour_price = retourPrice;
    if (active !== undefined) updates.active = active;

    const { data, error } = await supabase()
      .from('shipping_items')
      .update(updates)
      .eq('id', id)
      .select('*, category:categories(name)')
      .single();
    if (error) throw error;
    logAudit(req, 'shipping_item_updated', { id, ...updates });
    return NextResponse.json(mapItem(data));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireActiveWorkSession(req);
    if (gate instanceof NextResponse) return gate;

    const { id } = await params;
    const { error } = await supabase()
      .from('shipping_items')
      .delete()
      .eq('id', id);
    if (error) throw error;
    logAudit(req, 'shipping_item_deleted', { id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
