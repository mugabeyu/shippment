import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
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

    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .eq('key', req.params.key)
      .single();

    if (error) throw error;

    let value: any;
    try {
      value = JSON.parse(data.value);
    } catch {
      value = data.value;
    }

    res.json({ key: data.key, value });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
