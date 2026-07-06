import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase()
      .from('receipts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { sentViaWhatsapp, pdfUrl } = await req.json();
    const updateData: any = {};
    if (sentViaWhatsapp !== undefined) updateData.sent_via_whatsapp = sentViaWhatsapp;
    if (pdfUrl !== undefined) updateData.pdf_url = pdfUrl;

    const { data, error } = await supabase()
      .from('receipts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    if (sentViaWhatsapp !== undefined) {
      logAudit(req, sentViaWhatsapp ? 'receipt_sent_whatsapp' : 'receipt_marked_unsent', { id });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
