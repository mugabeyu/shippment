import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { status, customerId, search } = req.query;

    let query = supabase
      .from('shipments')
      .select('*, customer:customers(*)')
      .order('date', { ascending: false });

    if (status) query = query.eq('status', status);
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
      .from('shipments')
      .select('*, customer:customers(*)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customerId, origin, destination, category, weightKg, quantity, description, status, date, paymentStatus, paymentMethod, trackingNumber, pickupDate, expectedArrival, insurance, specialInstructions, internalNotes, photos } = req.body;

    const tracking = trackingNumber || `TRK-${Math.floor(1000 + Math.random() * 9000)}`;

    let basePrice = 0;
    const { data: categoryRow } = await supabase
      .from('categories')
      .select('price_per_kg')
      .eq('name', category)
      .single();

    if (categoryRow?.price_per_kg) {
      basePrice = Number(categoryRow.price_per_kg) * (weightKg || 0) * (quantity || 1);
    } else {
      const { data: settingsRow } = await supabase
        .from('settings')
        .select('default_rate_per_kg')
        .single();
      const defaultRate = settingsRow?.default_rate_per_kg || 0;
      basePrice = defaultRate * (weightKg || 0) * (quantity || 1);
    }

    let discountAmount = 0;
    const { data: activeOffer } = await supabase
      .from('offers')
      .select('discount_percent, discount_amount')
      .eq('active', true)
      .maybeSingle();

    if (activeOffer) {
      if (Number(activeOffer.discount_percent) > 0) {
        discountAmount = Math.round(basePrice * (Number(activeOffer.discount_percent) / 100));
      } else if (Number(activeOffer.discount_amount) > 0) {
        discountAmount = Number(activeOffer.discount_amount);
      }
    }

    const finalAmount = Math.max(0, basePrice - discountAmount);

    const normalizedPhotos = Array.isArray(photos) ? photos.slice(0, 3) : [];

    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert([{
        tracking_number: tracking,
        customer_id: customerId,
        origin,
        destination,
        category,
        weight_kg: weightKg,
        quantity,
        description,
        status: status || 'Pending',
        date: date || new Date().toISOString().split('T')[0],
        payment_status: paymentStatus || 'Unpaid',
        payment_method: paymentMethod,
        pickup_date: pickupDate || null,
        expected_arrival: expectedArrival || null,
        insurance: !!insurance,
        special_instructions: specialInstructions || '',
        internal_notes: internalNotes || '',
        photos: normalizedPhotos,
        base_price: basePrice,
        discount_amount: discountAmount,
        final_amount: finalAmount
      }])
      .select('*, customer:customers(*)')
      .single();

    if (shipmentError) throw shipmentError;

    const { data: customer } = await supabase
      .from('customers')
      .select('total_kg_sent')
      .eq('id', customerId)
      .single();

    if (customer) {
      await supabase
        .from('customers')
        .update({ total_kg_sent: (customer.total_kg_sent || 0) + weightKg })
        .eq('id', customerId);
    }

    res.status(201).json(shipment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { customerId, origin, destination, category, weightKg = 0, quantity = 1, description, status, date, paymentStatus, paymentMethod, receiptSent, pickupDate, expectedArrival, insurance, specialInstructions, internalNotes, photos } = req.body;
    const normalizedPhotos = Array.isArray(photos) ? photos.slice(0, 3) : [];

    const { data: oldShipment } = await supabase
      .from('shipments')
      .select('weight_kg, customer_id')
      .eq('id', req.params.id)
      .single();

    const { data, error } = await supabase
      .from('shipments')
      .update({
        customer_id: customerId,
        origin,
        destination,
        category,
        weight_kg: weightKg,
        quantity,
        description,
        status,
        date,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        receipt_sent: receiptSent,
        pickup_date: pickupDate || null,
        expected_arrival: expectedArrival || null,
        insurance: !!insurance,
        special_instructions: specialInstructions || '',
        internal_notes: internalNotes || '',
        photos: normalizedPhotos,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select('*, customer:customers(*)')
      .single();

    if (error) throw error;

    if (oldShipment && customerId !== oldShipment.customer_id) {
      const { data: oldCustomer } = await supabase
        .from('customers')
        .select('total_kg_sent')
        .eq('id', oldShipment.customer_id)
        .single();
      if (oldCustomer) {
        await supabase
          .from('customers')
          .update({ total_kg_sent: Math.max(0, (oldCustomer.total_kg_sent || 0) - (oldShipment.weight_kg || 0)) })
          .eq('id', oldShipment.customer_id);
      }

      const { data: newCustomer } = await supabase
        .from('customers')
        .select('total_kg_sent')
        .eq('id', customerId)
        .single();
      if (newCustomer) {
        await supabase
          .from('customers')
          .update({ total_kg_sent: (newCustomer.total_kg_sent || 0) + weightKg })
          .eq('id', customerId);
      }
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const { data, error } = await supabase
      .from('shipments')
      .update({ status, updated_at: new Date() })
      .eq('id', req.params.id)
      .select('*, customer:customers(*)')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { data: shipment } = await supabase
      .from('shipments')
      .select('weight_kg, customer_id')
      .eq('id', req.params.id)
      .single();

    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    if (shipment) {
      const { data: customer } = await supabase
        .from('customers')
        .select('total_kg_sent')
        .eq('id', shipment.customer_id)
        .single();

      if (customer) {
        await supabase
          .from('customers')
          .update({ total_kg_sent: Math.max(0, (customer.total_kg_sent || 0) - (shipment.weight_kg || 0)) })
          .eq('id', shipment.customer_id);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
