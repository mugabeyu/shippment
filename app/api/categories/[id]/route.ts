import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { requireActiveWorkSession } from '@/lib/workSession';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

const mapCategory = (row: any) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  handlingNotes: row.handling_notes,
  icon: row.icon,
  pricePerKg: row.price_per_kg ?? 0,
  pricingMode: row.pricing_mode || 'per_item'
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase()
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return NextResponse.json(mapCategory(data));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireActiveWorkSession(req);
    if (gate instanceof NextResponse) return gate;

    const { id } = await params;
    const { name, description, handlingNotes, pricePerKg, pricingMode } = await req.json();
    const updates: Record<string, any> = { name, description, handling_notes: handlingNotes, price_per_kg: pricePerKg ?? 0, updated_at: new Date() };
    if (pricingMode !== undefined) updates.pricing_mode = pricingMode === 'per_kg' ? 'per_kg' : 'per_item';
    const { data, error } = await supabase()
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    logAudit(req, 'category_updated', { id, name }, gate.staff);
    return NextResponse.json(mapCategory(data));
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
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    logAudit(req, 'category_deleted', { id }, gate.staff);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
