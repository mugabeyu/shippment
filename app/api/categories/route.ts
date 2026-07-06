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

export async function GET() {
  try {
    const { data, error } = await supabase()
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data.map(mapCategory));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, handlingNotes, pricePerKg } = await req.json();
    const { data, error } = await supabase()
      .from('categories')
      .insert([{ name, description, handling_notes: handlingNotes, price_per_kg: pricePerKg ?? 0 }])
      .select()
      .single();
    if (error) throw error;
    logAudit(req, 'category_created', { name, pricePerKg });
    return NextResponse.json(mapCategory(data), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
