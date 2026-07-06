import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function GET(req: NextRequest, { params }: { params: Promise<{ receiptNumber: string }> }) {
  try {
    const { receiptNumber } = await params;
    const { data, error } = await supabase()
      .from('receipts')
      .select('*')
      .eq('receipt_number', receiptNumber)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
