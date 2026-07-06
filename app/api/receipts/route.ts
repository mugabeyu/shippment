import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shipmentId = searchParams.get('shipmentId');
    const customerId = searchParams.get('customerId');
    const limit = Number(searchParams.get('limit') || 100);
    const offset = Number(searchParams.get('offset') || 0);

    let query = supabase()
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (shipmentId) query = query.eq('shipment_id', shipmentId);
    if (customerId) query = query.eq('customer_id', customerId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { receiptNumber, shipmentId, customerId, staffId, subtotal, tax, total, currency, pdfUrl, sentViaWhatsapp } = await req.json();
    const { data, error } = await supabase()
      .from('receipts')
      .insert([{ receipt_number: receiptNumber, shipment_id: shipmentId, customer_id: customerId, staff_id: staffId, subtotal, tax, total, currency, pdf_url: pdfUrl, sent_via_whatsapp: sentViaWhatsapp }])
      .select()
      .single();
    if (error) throw error;
    logAudit(req, 'receipt_created', { receiptNumber, shipmentId, customerId, total, currency });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
