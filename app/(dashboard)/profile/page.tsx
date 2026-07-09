'use client';

import { useUiStore } from '@/lib/store';
import { User, Mail, Phone, Shield, Calendar, Camera, Save, Edit3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAppConfig } from '@/lib/swr';
import type { Staff } from '@/lib/swr';
import { useT } from '@/lib/i18n';

export default function Profile() {
  const { activeStaffEmail, setActiveStaff } = useUiStore();
  const t = useT();
  const { config } = useAppConfig();
  const content = config?.profile_content || {};
  const [isEditing, setIsEditing] = useState(false);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Staff' as 'Admin' | 'Staff',
    department: '',
    photo: ''
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!activeStaffEmail) return;
    setLoading(true);
    api.getStaff()
      .then(staffList => {
        const currentStaff = staffList.find(s => s.email === activeStaffEmail);
        if (currentStaff) {
          setStaff(currentStaff);
          setFormData({
            name: currentStaff.name || '',
            email: currentStaff.email || '',
            phone: currentStaff.phone || '',
            role: currentStaff.role,
            department: currentStaff.department || '',
            photo: currentStaff.photo || ''
          });
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [activeStaffEmail]);

  const handleSave = async () => {
    if (!staff) return;
    const updated = await api.updateStaff(staff.id, {
      name: formData.name,
      phone: formData.phone,
      department: formData.department,
      photo: formData.photo
    });
    setActiveStaff(formData.name, formData.email, formData.role, updated?.photo ?? formData.photo);
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-white/40">Loading profile...</div>;
  }

  if (!staff) {
    return <div className="flex items-center justify-center h-64 text-white/40">Profile not found.</div>;
  }

  const joinDate = staff.last_login ? `Active since ${new Date(staff.last_login).toLocaleDateString()}` : 'Joined recently';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-white/90">{content.title || t('Admin Profile')}</h1>
        <p className="text-sm text-white/40 mt-0.5">{content.subtitle || t('Manage your profile and preferences.')}</p>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-[#1E1E2E] border-2 border-dashed border-white/[0.15] flex items-center justify-center overflow-hidden">
              {formData.photo ? (
                <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-white/40" />
              )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors shadow-md">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setFormData({ ...formData, photo: reader.result as string });
                  reader.readAsDataURL(file);
                }} className="hidden" />
              </label>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white/90">{formData.name}</h2>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="p-2 text-white/40 hover:text-primary transition-colors">
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm text-white/60 bg-[#1A1C24] border border-white/[0.06] p-3 rounded-lg">
                <Mail className="w-4 h-4 text-white/40" />
                <span>{formData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60 bg-[#1A1C24] border border-white/[0.06] p-3 rounded-lg">
                <Phone className="w-4 h-4 text-white/40" />
                <span>{formData.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60 bg-[#1A1C24] border border-white/[0.06] p-3 rounded-lg">
                <Shield className="w-4 h-4 text-white/40" />
                <span>{formData.role}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60 bg-[#1A1C24] border border-white/[0.06] p-3 rounded-lg">
                <Calendar className="w-4 h-4 text-white/40" />
                <span>{joinDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="card p-6 space-y-5">
              <h3 className="text-base font-semibold text-white/90">{t('Edit Profile')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-white/50 mb-1">{t('Full Name')}</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-white/50 mb-1">{t('Email')}</label>
              <input type="email" value={formData.email} readOnly disabled className="input-field bg-[#1E1E2E] text-white/50 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-white/50 mb-1">{t('Phone')}</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-white/50 mb-1">{t('Department')}</label>
              <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-white/60 hover:text-white/90 transition-colors">{t('Cancel')}</button>
            <button onClick={handleSave} className="btn-primary"><Save className="w-4 h-4 mr-2" />{saved ? t('Saved!') : t('Save Changes')}</button>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="text-base font-semibold text-white/90 mb-4">{t('Change Password')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium uppercase tracking-wider text-white/50 mb-1">{t('Current Password')}</label>
            <input type="password" className="input-field" placeholder={t('Enter current password')} />
          </div>
          <div>
            <label className="block text-sm font-medium uppercase tracking-wider text-white/50 mb-1">{t('New Password')}</label>
            <input type="password" className="input-field" placeholder={t('Enter new password')} />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary">{t('Update Password')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

