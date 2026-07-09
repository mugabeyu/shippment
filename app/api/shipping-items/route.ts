import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

const mapItem = (row: any) => ({
  id: row.id,
  categoryId: row.category_id,
  categoryName: row.category?.name ?? row.category_name ?? null,
  item: row.item,
  allerPrice: row.aller_price ?? 0,
  retourPrice: row.retour_price ?? null,
  active: row.active ?? true,
});

export async function GET() {
  try {
    const { data, error } = await supabase()
      .from('shipping_items')
      .select('*, category:categories(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json((data || []).map(mapItem));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { categoryId, item, allerPrice, retourPrice } = await req.json();
    if (!categoryId || !item) {
      return NextResponse.json({ error: 'Category and item name are required' }, { status: 400 });
    }
    if (allerPrice === undefined || allerPrice === null) {
      return NextResponse.json({ error: 'Aller price is required' }, { status: 400 });
    }
    const { data, error } = await supabase()
      .from('shipping_items')
      .insert([{
        category_id: categoryId,
        item,
        aller_price: allerPrice,
        retour_price: retourPrice ?? null,
      }])
      .select('*, category:categories(name)')
      .single();
    if (error) throw error;
    logAudit(req, 'shipping_item_created', { id: data.id, categoryId, item, allerPrice, retourPrice });
    return NextResponse.json(mapItem(data), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
