'use client';

import React, { useState } from 'react';
import { useStaff, type Staff } from '@/lib/swr';
import { Search, Mail, Shield, Ban, UserCheck, UserPlus, Send } from 'lucide-react';
import { useUiStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { useToast } from '@/lib/toast';

export default function Staff() {
  const { staff, loading, updateStaff, toggleStaffActive, resendStaffInvite } = useStaff();
  const { activeStaffRole, activeStaffEmail } = useUiStore();
  const t = useT();
  const { toast } = useToast();
  const isAdmin = activeStaffRole === 'Admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvingRole, setApprovingRole] = useState<'Admin' | 'Staff'>('Staff');

  const handleApprove = async (id: string) => {
    setSending(true);
    try {
      const updated = await updateStaff(id, { active: true, role: approvingRole });
      toast('success', `${updated.name || updated.email} ${t('has been approved as')} ${approvingRole}.`);
      setApprovingId(null);
    } catch (err: any) {
      toast('error', err.message || t('Failed to approve staff'));
    } finally {
      setSending(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setSending(true);
    try {
      const updated = await toggleStaffActive(id, !currentActive);
      toast('success', `${updated.name || updated.email} ${!currentActive ? t('has been unblocked.') : t('has been blocked.')}`);
    } catch (err: any) {
      toast('error', err.message || t('Failed to update staff status'));
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (id: string) => {
    setSending(true);
    try {
      await resendStaffInvite(id);
      toast('success', t('Invitation resent.'));
    } catch (err: any) {
      toast('error', err.message || t('Failed to resend invitation'));
    } finally {
      setSending(false);
    }
  };

  const filteredStaff = staff.filter(
    (s) =>
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-white/40">{t('Loading staff...')}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white/90">{t('Staff Management')}</h1>
          <p className="text-sm text-white/40 mt-0.5">{t('Manage existing staff and approve pending access.')}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('Search by name or email...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredStaff.map((s) => {
            const isSelf = s.email === activeStaffEmail;
            const canManage = isAdmin && !isSelf;
            const isPending = !s.name;
            return (
              <div key={s.id} className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#12141C]/[0.04] border border-white/[0.06] flex items-center justify-center overflow-hidden">
                    {s.photo ? <img src={s.photo} alt={s.name} className="w-full h-full object-cover" /> : <span className="text-lg font-bold text-amber-500">{(s.name || s.email).split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white/90">{s.name || t('Pending Invite')}</h3>
                    <span className={`inline-block px-2 py-0.5 text-sm font-medium rounded-full ${s.role === 'Admin' ? 'bg-amber-100 text-amber-700' : 'bg-[#12141C]/[0.04] text-white/60'}`}>{t(s.role)}</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-white/60">
                  <div className="flex items-center"><Mail className="w-4 h-4 mr-2 text-slate-400" />{s.email}</div>
                  {s.phone && <div className="flex items-center"><Shield className="w-4 h-4 mr-2 text-slate-400" />{s.phone}</div>}
                  <div className="flex items-center"><span className="text-white/40 mr-2">{t('Status')}:</span><span className={`px-2 py-0.5 rounded-full text-sm font-medium ${s.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.active ? t('Active') : t('Blocked')}</span></div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {isPending ? (
                    <>
                      {approvingId === s.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <select
                            value={approvingRole}
                            onChange={(e) => setApprovingRole(e.target.value as 'Admin' | 'Staff')}
                            className="px-2 py-1.5 bg-[#12141C] border border-white/[0.06] rounded-lg text-white text-sm"
                          >
                            <option value="Staff">{t('Staff')}</option>
                            <option value="Admin">{t('Admin')}</option>
                          </select>
                          <button
                            disabled={sending}
                            onClick={() => handleApprove(s.id)}
                            className="px-3 py-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            {t('Approve')}
                          </button>
                          <button onClick={() => setApprovingId(null)} className="px-3 py-1.5 text-sm text-white/40 hover:text-white transition-colors">{t('Cancel')}</button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => { setApprovingId(s.id); setApprovingRole('Staff'); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          >
                            <UserPlus className="w-4 h-4" /> {t('Approve')}
                          </button>
                          <button
                            onClick={() => handleResend(s.id)}
                            disabled={sending}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/40 hover:text-white/90 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" /> {t('Resend Invite')}
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <button
                      disabled={!canManage || sending}
                      onClick={() => handleToggleActive(s.id, s.active)}
                      title={isSelf ? t('You cannot block your own account.') : !isAdmin ? t('Only admins can block staff.') : (s.active ? t('Block') : t('Unblock'))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        !canManage
                          ? 'text-white/20 cursor-not-allowed'
                          : s.active
                            ? 'text-red-400 hover:bg-red-500/10'
                            : 'text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      {s.active ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      {s.active ? t('Block') : t('Unblock')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
