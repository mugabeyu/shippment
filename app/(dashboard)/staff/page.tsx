'use client';

import React, { useState } from 'react';
import { useStaff, type Staff } from '@/lib/swr';
import { Plus, Search, X, Mail, Shield, CheckCircle, Ban, UserCheck } from 'lucide-react';
import { useUiStore } from '@/lib/store';

export default function Staff() {
  const { staff, loading, inviteStaff, updateStaff, toggleStaffActive } = useStaff();
  const { activeStaffRole } = useUiStore();
  const isAdmin = activeStaffRole === 'Admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteDraft, setInviteDraft] = useState<{ email: string; role: 'Admin' | 'Staff' }>({ email: '', role: 'Staff' });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvingRole, setApprovingRole] = useState<'Admin' | 'Staff'>('Staff');

  const openInvite = () => {
    setInviteDraft({ email: '', role: 'Staff' });
    setMessage(null);
    setIsInviteModalOpen(true);
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
      setMessage({ type: 'success', text: `Invitation sent! We emailed ${inviteDraft.email} a link to set their password and log in.` });
      setInviteDraft({ email: '', role: 'Staff' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to send invitation' });
    } finally {
      setSending(false);
    }
  };

  const handleApprove = async (id: string) => {
    setSending(true);
    try {
      const updated = await updateStaff(id, { active: true, role: approvingRole });
      setMessage({ type: 'success', text: `${updated.name || updated.email} has been approved as ${approvingRole}.` });
      setTimeout(() => setMessage(null), 3000);
      setApprovingId(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to approve staff' });
    } finally {
      setSending(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setSending(true);
    try {
      const updated = await toggleStaffActive(id, !currentActive);
      setMessage({ type: 'success', text: `${updated.name || updated.email} has been ${!currentActive ? 'activated' : 'blocked'}.` });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update staff status' });
    } finally {
      setSending(false);
    }
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
        <div>
          <h1 className="text-lg font-semibold text-navy-900">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Invite new staff and approve pending access.</p>
        </div>
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
              <div className="flex items-center gap-3 mb-4">
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
                    s.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {s.active ? 'Active' : 'Blocked'}
                  </span>
                </div>
              </div>

              {!s.active && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assign Role</span>
                    <select
                      value={approvingId === s.id ? approvingRole : (s.role === 'Admin' ? 'Admin' : 'Staff')}
                      onChange={(e) => { setApprovingId(s.id); setApprovingRole(e.target.value as 'Admin' | 'Staff'); }}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-navy-900 bg-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Staff">Staff</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleApprove(s.id)}
                    disabled={sending}
                    className="flex items-center w-full justify-center px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Access
                  </button>
                </div>
              )}

              {isAdmin && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleToggleActive(s.id, s.active)}
                    disabled={sending}
                    className={`flex items-center w-full justify-center px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                      s.active
                        ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                        : 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
                    }`}>
                    {s.active ? (
                      <>
                        <Ban className="w-4 h-4 mr-2" />
                        Block Access
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Unblock Access
                      </>
                    )}
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
                  <p className="text-xs text-slate-500">An email will be sent to the staff member with a link to set their password and complete registration. If the email doesn't arrive, you can share the registration link manually.</p>
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
                     <p className="text-xs text-slate-500 mt-2">We emailed the staff member a link to set their password. If it didn't arrive, share this link manually — they will use it to set their password and log in.</p>
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
    </div>
  );
}
