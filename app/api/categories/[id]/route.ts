import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

const mapCategory = (row: any) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  handlingNotes: row.handling_notes,
  icon: row.icon,
  pricePerKg: row.price_per_kg ?? 0
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
    const { id } = await params;
    const { name, description, handlingNotes, pricePerKg } = await req.json();
    const { data, error } = await supabase()
      .from('categories')
      .update({ name, description, handling_notes: handlingNotes, price_per_kg: pricePerKg ?? 0, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    logAudit(req, 'category_updated', { id, name });
    return NextResponse.json(mapCategory(data));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabase()
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    logAudit(req, 'category_deleted', { id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
