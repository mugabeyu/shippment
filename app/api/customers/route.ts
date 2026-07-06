import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function GET() {
  try {
    const { data, error } = await supabase()
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, address, notes, photo } = await req.json();
    const { data, error } = await supabase()
      .from('customers')
      .insert([{ name, phone, email, address, notes, photo, total_kg_sent: 0 }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
