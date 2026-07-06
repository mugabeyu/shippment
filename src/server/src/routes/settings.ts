import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*, routes:routes(*)')
      .limit(1)
      .single();

    if (error) throw error;

    res.json({
      ...data,
      paymentMethods: data.payment_methods || [],
      routes: data.routes || [],
      loyaltyEnabled: data.loyalty_enabled ?? true,
      taxEnabled: data.tax_enabled ?? false,
      taxRate: data.tax_rate ?? 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { companyName, contactEmail, phone, address, currency, defaultRatePerKg, paymentMethods, loyaltyEnabled, taxEnabled, taxRate } = req.body;

    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .limit(1)
      .single();

    let data, error;
    if (existing) {
      ({ data, error } = await supabase
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
        .single());
    } else {
      ({ data, error } = await supabase
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
        .single());
    }

    if (error) throw error;
    res.json({ ...data, paymentMethods: data.payment_methods });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
