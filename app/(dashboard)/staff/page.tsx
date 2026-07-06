'use client';

import React, { useState } from 'react';
import { useStaff, type Staff } from '@/lib/swr';
import { Plus, Search, X, Edit2, Trash2, Camera, Mail, Shield, UserCheck, Clock } from 'lucide-react';

export default function Staff() {
  const { staff, loading, inviteStaff, resendStaffInvite, completeStaffProfile, updateStaff, deleteStaff, reload } = useStaff();
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [inviteDraft, setInviteDraft] = useState<{ email: string; role: 'Admin' | 'Staff' }>({ email: '', role: 'Staff' });
  const [editDraft, setEditDraft] = useState<Staff | null>(null);
  const [profileDraft, setProfileDraft] = useState<{ id: string; name: string; phone: string; photo: string } | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inviteLink, setInviteLink] = useState('');

  const openInvite = () => {
    setInviteDraft({ email: '', role: 'Staff' });
    setMessage(null);
    setIsInviteModalOpen(true);
  };
  const openEdit = (s: Staff) => {
    setEditDraft(s);
    setIsEditModalOpen(true);
  };
  const openProfile = (s: Staff) => {
    setProfileDraft({ id: s.id, name: s.name, phone: s.phone, photo: s.photo });
    setPhotoPreview(s.photo);
    setIsProfileModalOpen(true);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    setInviteLink('');
    try {
      const result = await inviteStaff(inviteDraft);
      const link = `${window.location.origin}/register?staffId=${result.id}`;
      setInviteLink(link);
      setMessage({ type: 'success', text: 'Invitation sent! Share the registration link below.' });
      setInviteDraft({ email: '', role: 'Staff' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to send invitation' });
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (id: string) => {
    setSending(true);
    try {
      const result = await resendStaffInvite(id);
      setMessage({ type: 'success', text: result.message || 'Invitation resent successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to resend invitation' });
    } finally {
      setSending(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileDraft) return;
    setSending(true);
    setMessage(null);
    try {
      await completeStaffProfile(profileDraft.id, {
        name: profileDraft.name,
        phone: profileDraft.phone,
        photo: profileDraft.photo || photoPreview
      });
      setMessage({ type: 'success', text: 'Profile completed successfully!' });
      setIsProfileModalOpen(false);
      setProfileDraft(null);
      setPhotoPreview('');
      reload();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to complete profile' });
    } finally {
      setSending(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDraft) return;
    setSending(true);
    try {
      await updateStaff(editDraft.id, editDraft);
      setIsEditModalOpen(false);
      setEditDraft(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update staff' });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await deleteStaff(id);
      setMessage({ type: 'success', text: 'Staff member removed' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete staff' });
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      if (profileDraft) {
        setProfileDraft({ ...profileDraft, photo: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Loading staff...</div>;
  }

  return (
    <div className="space-y-5">
      {message && (
        <div className={`rounded-lg p-4 ${message.type === 'success' ? 'bg-green-100 border border-green-200 text-green-700' : 'bg-red-500/10 border border-red-500/30 text-red-600'}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-lg font-semibold text-navy-900">Staff Management</h1>
        <button
          onClick={openInvite}
          disabled={sending}
          className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          Invite Staff
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredStaff.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                    {s.photo ? (
                      <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                    ) : s.name ? (
                      <span className="text-lg font-bold text-amber-500">
                        {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </span>
                    ) : (
                      <Mail className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-navy-900">{s.name || 'Pending Invite'}</h3>
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      s.role === 'Admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {s.role}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {s.active && (
                    <button
                      onClick={() => openEdit(s)}
                      aria-label={`Edit ${s.name || s.email}`}
                      className="p-1.5 text-slate-500 hover:text-navy-900 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(s.id)}
                    aria-label={`Delete ${s.email}`}
                    className="p-1.5 text-slate-500 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-slate-400" />
                  {s.email}
                </div>
                {s.phone && (
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-slate-400" />
                    {s.phone}
                  </div>
                )}
                <div className="flex items-center">
                  <span className="text-slate-500 mr-2">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {s.active ? 'Active' : 'Invitation Sent'}
                  </span>
                </div>
              </div>

              {!s.active && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleResend(s.id)}
                    disabled={sending}
                    className="flex items-center w-full justify-center px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50">
                    <Clock className="w-4 h-4 mr-2" />
                    Resend Invitation
                  </button>
                </div>
              )}

              {s.active && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => openProfile(s)}
                    className="flex items-center w-full justify-center px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                    <UserCheck className="w-4 h-4 mr-2" />
                    View / Edit Profile
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="p-8 text-center text-slate-500">No staff found.</div>
        )}
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-navy-900">Invite New Staff</h2>
              <button onClick={() => { setIsInviteModalOpen(false); setInviteLink(''); }} className="text-slate-500 hover:text-navy-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {!inviteLink ? (
                <>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">Email Address</label>
                    <input
                      required
                      type="email"
                      value={inviteDraft.email}
                      onChange={(e) => setInviteDraft({ ...inviteDraft, email: e.target.value })}
                      className="input-field"
                      placeholder="staff@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">Role</label>
                    <select
                      value={inviteDraft.role}
                      onChange={(e) => setInviteDraft({ ...inviteDraft, role: e.target.value as 'Admin' | 'Staff' })}
                      className="input-field"
                    >
                      <option value="Staff">Staff</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <p className="text-xs text-slate-500">An invitation will be created. Share the registration link with the staff member so they can set their password and complete registration.</p>
                  <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={() => { setIsInviteModalOpen(false); setInviteLink(''); }} className="px-4 py-2 text-slate-500 hover:text-navy-900 transition-colors">Cancel</button>
                    <button type="button" onClick={handleInvite} disabled={sending} className="btn-primary disabled:opacity-50">
                      {sending ? 'Creating Invite...' : 'Send Invitation'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-green-700 font-medium">Invitation created successfully!</p>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">Registration Link</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={inviteLink}
                        className="input-field text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(inviteLink)}
                        className="px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Send this link to the staff member. They will use it to set their password and complete registration.</p>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button type="button" onClick={() => { setIsInviteModalOpen(false); setInviteLink(''); }} className="px-4 py-2 text-sm text-slate-500 hover:text-navy-900 transition-colors">Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editDraft && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-navy-900">Edit Staff</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-navy-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={editDraft.name}
                  onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">Email Address</label>
                <input
                  required
                  type="email"
                  value={editDraft.email}
                  onChange={(e) => setEditDraft({ ...editDraft, email: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">Phone Number</label>
                <input
                  required
                  type="tel"
                  value={editDraft.phone}
                  onChange={(e) => setEditDraft({ ...editDraft, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">Role</label>
                <select
                  value={editDraft.role}
                  onChange={(e) => setEditDraft({ ...editDraft, role: e.target.value as 'Admin' | 'Staff' })}
                  className="input-field"
                >
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={editDraft.active}
                  onChange={(e) => setEditDraft({ ...editDraft, active: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 focus:ring-offset-white bg-slate-50"
                />
                <label htmlFor="active" className="text-sm text-slate-700">Active</label>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-500 hover:text-navy-900 transition-colors">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isProfileModalOpen && profileDraft && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-navy-900">Complete Profile</h2>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-500 hover:text-navy-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCompleteProfile} className="p-5 space-y-5">
              <div className="flex justify-center mb-4">
                <label className="relative w-24 h-24 rounded-full bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-amber-500 transition-colors overflow-hidden">
                  {photoPreview || profileDraft.photo ? (
                    <img src={photoPreview || profileDraft.photo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-slate-500" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={profileDraft.name}
                  onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">Phone Number</label>
                <input
                  required
                  type="tel"
                  value={profileDraft.phone}
                  onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <p className="text-xs text-slate-500">This information will be used to activate the staff account.</p>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 text-slate-500 hover:text-navy-900 transition-colors">Cancel</button>
                <button type="submit" disabled={sending} className="btn-primary disabled:opacity-50">
                  {sending ? 'Saving...' : 'Complete Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
