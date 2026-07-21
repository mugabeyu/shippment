import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { requireActiveWorkSession } from '@/lib/workSession';

export const dynamic = 'force-dynamic';

const supabase = () => getServiceSupabase();

export async function GET() {
  try {
    const { data, error } = await supabase()
      .from('settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({
        paymentMethods: [],
        loyaltyEnabled: true,
        taxEnabled: false,
        taxRate: 0
      });
    }
    const row = data[0];
    return NextResponse.json({
      ...row,
      paymentMethods: row.payment_methods || [],
      loyaltyEnabled: row.loyalty_enabled ?? true,
      taxEnabled: row.tax_enabled ?? false,
      taxRate: row.tax_rate ?? 0
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const gate = await requireActiveWorkSession(req);
    if (gate instanceof NextResponse) return gate;

    const { companyName, contactEmail, phone, address, currency, defaultRatePerKg, paymentMethods, loyaltyEnabled, taxEnabled, taxRate } = await req.json();
    const { data: existingRows, error: lookupError } = await supabase()
      .from('settings')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1);
    if (lookupError) throw lookupError;
    const existing = existingRows && existingRows[0];

    let data, error;
    if (existing) {
      ({ data, error } = await supabase()
        .from('settings')
        .update({
          company_name: companyName,
          contact_email: contactEmail,
          phone,
          address,
          currency,
          default_rate_per_kg: defaultRatePerKg,
          payment_methods: paymentMethods,
          loyalty_enabled: loyaltyEnabled,
          tax_enabled: taxEnabled,
          tax_rate: taxRate,
          updated_at: new Date()
        })
        .eq('id', existing.id)
        .select()
        .limit(1));
      data = data?.[0];
    } else {
      ({ data, error } = await supabase()
        .from('settings')
        .insert([{
          company_name: companyName,
          contact_email: contactEmail,
          phone,
          address,
          currency,
          default_rate_per_kg: defaultRatePerKg,
          payment_methods: paymentMethods,
          loyalty_enabled: loyaltyEnabled,
          tax_enabled: taxEnabled,
          tax_rate: taxRate
        }])
        .select()
        .limit(1));
      data = data?.[0];
    }

    if (error) throw error;
    logAudit(req, existing ? 'settings_updated' : 'settings_created', { companyName }, gate.staff);
    return NextResponse.json({ ...data, paymentMethods: data.payment_methods });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
