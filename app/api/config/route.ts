import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function GET() {
  try {
    const { data, error } = await supabase()
      .from('app_config')
      .select('*');
    if (error) throw error;

    const config: Record<string, any> = {};
    for (const item of data || []) {
      try {
        config[item.key] = JSON.parse(item.value);
      } catch {
        config[item.key] = item.value;
      }
    }
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
