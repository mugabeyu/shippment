import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function PATCH(req: NextRequest) {
  try {
    const { staffId } = await req.json();
    const { error } = await supabase()
      .from('notifications')
      .update({ read: true })
      .eq('read', false)
      .eq('staff_id', staffId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

