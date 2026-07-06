import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params;
    const { data, error } = await supabase()
      .from('app_config')
      .select('*')
      .eq('key', key)
      .single();
    if (error) throw error;

    let value: any;
    try {
      value = JSON.parse(data.value);
    } catch {
      value = data.value;
    }
    return NextResponse.json({ key: data.key, value });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
