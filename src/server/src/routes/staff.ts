import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Get all staff
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, email, role, phone, photo, active, invited_at, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single staff
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, email, role, phone, photo, active, invited_at, created_at, updated_at')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create staff invitation
router.post('/', async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    // Check if staff already exists
    const { data: existing } = await supabase
      .from('staff')
      .select('id, active')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'Staff member with this email already exists' });
    }

    // Create staff record in pending state
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .insert([{ email, role, active: false, name: '', phone: '' }])
      .select('id, name, email, role, phone, photo, active, invited_at, created_at, updated_at')
      .single();

    if (staffError) throw staffError;

    // Send Supabase Auth invite
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { role, staffId: staff.id }
    });

    if (inviteError) {
      await supabase.from('staff').delete().eq('id', staff.id);
      throw inviteError;
    }

    res.status(201).json({
      ...staff,
      message: 'Invitation sent successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resend invitation
router.post('/:id/resend-invite', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('email, active')
      .eq('id', id)
      .single();

    if (staffError || !staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    if (staff.active) {
      return res.status(400).json({ error: 'Staff member is already active' });
    }

    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(staff.email, {
      data: { staffId: id }
    });

    if (inviteError) throw inviteError;

    res.json({
      message: 'Invitation resent successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Complete profile (called after user accepts invite)
router.patch('/:id/complete-profile', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, photo, authUid } = req.body;

    const updateData: any = { name, phone, photo, active: true };
    if (authUid) {
      updateData.auth_uid = authUid;
    }

    const { data, error } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', id)
      .select('id, name, email, role, phone, photo, active, invited_at, created_at, updated_at')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register staff (accept invitation + create auth user)
router.post('/:id/register', async (req, res) => {
  try {
    const { id } = req.params;
    const { password, name, phone, photo } = req.body;

    if (!password || !name || !phone) {
      return res.status(400).json({ error: 'Password, name, and phone are required' });
    }

    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();

    if (staffError || !staff) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (staff.active) {
      return res.status(400).json({ error: 'This invitation has already been accepted' });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: staff.email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, role: staff.role, staffId: staff.id }
    });

    if (authError) throw authError;

    const { data: updated, error: updateError } = await supabase
      .from('staff')
      .update({
        name,
        phone,
        photo: photo || '',
        active: true,
        auth_uid: authData.user.id,
        updated_at: new Date()
      })
      .eq('id', id)
      .select('id, name, email, role, phone, photo, active, invited_at, created_at, updated_at')
      .single();

    if (updateError) throw updateError;

    res.status(201).json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update staff
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, phone, photo, active } = req.body;

    const { data, error } = await supabase
      .from('staff')
      .update({ name, email, role, phone, photo, active, updated_at: new Date() })
      .eq('id', req.params.id)
      .select('id, name, email, role, phone, photo, active, invited_at, created_at, updated_at')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete staff
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: staff } = await supabase
      .from('staff')
      .select('auth_uid, email')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (staff?.auth_uid) {
      await supabase.auth.admin.deleteUser(staff.auth_uid);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
