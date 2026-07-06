import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { shipmentId, customerId, limit = 100, offset = 0 } = req.query;
    let query = supabase
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (shipmentId) query = query.eq('shipment_id', shipmentId);
    if (customerId) query = query.eq('customer_id', customerId);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/number/:receiptNumber', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('receipt_number', req.params.receiptNumber)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { receiptNumber, shipmentId, customerId, staffId, subtotal, tax, total, currency, pdfUrl, sentViaWhatsapp } = req.body;

    const { data, error } = await supabase
      .from('receipts')
      .insert([{ receipt_number: receiptNumber, shipment_id: shipmentId, customer_id: customerId, staff_id: staffId, subtotal, tax, total, currency, pdf_url: pdfUrl, sent_via_whatsapp: sentViaWhatsapp }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { sentViaWhatsapp, pdfUrl } = req.body;
    const updateData: any = {};
    if (sentViaWhatsapp !== undefined) updateData.sent_via_whatsapp = sentViaWhatsapp;
    if (pdfUrl !== undefined) updateData.pdf_url = pdfUrl;

    const { data, error } = await supabase
      .from('receipts')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
