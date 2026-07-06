'use client';

import { useUiStore } from '@/lib/store';
import { User, Mail, Phone, Shield, Calendar, Clock, Camera, Save, Edit3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAppConfig } from '@/lib/swr';
import type { Staff } from '@/lib/swr';

export default function Profile() {
  const { activeStaffEmail, setActiveStaff } = useUiStore();
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
  const [loginHistory, setLoginHistory] = useState<Array<{ time: string; ip: string; device: string }>>([]);

  useEffect(() => {
    if (!activeStaffEmail) return;
    api.getAuditLogs({ action: 'admin_login', limit: 20 })
      .then(logs => {
        setLoginHistory(logs.map(log => ({
          time: new Date(log.createdAt || '').toLocaleString() || 'Unknown',
          ip: log.ipAddress || '-',
          device: log.details?.device || 'Unknown'
        })).slice(0, 5));
      })
      .catch(() => setLoginHistory([]));
  }, [activeStaffEmail]);

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
    await api.updateStaff(staff.id, { name: formData.name, email: formData.email });
    setActiveStaff(formData.name, formData.email);
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Loading profile...</div>;
  }

  if (!staff) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Profile not found.</div>;
  }

  const joinDate = staff.last_login ? `Active since ${new Date(staff.last_login).toLocaleDateString()}` : 'Joined recently';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-navy-900">{content.title || 'Admin Profile'}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{content.subtitle || 'Manage your profile and preferences.'}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
              {formData.photo ? (
                <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-400" />
              )}
            </div>
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
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-navy-900">{formData.name}</h2>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="p-2 text-slate-500 hover:text-primary transition-colors">
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{formData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{formData.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                <Shield className="w-4 h-4 text-slate-400" />
                <span>{formData.role}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{joinDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-base font-semibold text-navy-900">Edit Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Phone</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Department</label>
              <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 hover:text-navy-900 transition-colors">Cancel</button>
            <button onClick={handleSave} className="btn-primary"><Save className="w-4 h-4 mr-2" />{saved ? 'Saved!' : 'Save Changes'}</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-navy-900 mb-4">Change Password</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Current Password</label>
            <input type="password" className="input-field" placeholder="Enter current password" />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">New Password</label>
            <input type="password" className="input-field" placeholder="Enter new password" />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary">Update Password</button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-navy-900 mb-4">Login History</h3>
        <div className="space-y-3">
          {loginHistory.length > 0 ? (
            loginHistory.map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-navy-900 font-medium">{entry.time}</span>
                </div>
                <span className="text-slate-500">{entry.device} &middot; {entry.ip}</span>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-4">No login history available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

