'use client';

import { useState } from 'react';
import { useAuditLogs, useAppConfig } from '@/lib/swr';
import { Search, Filter } from 'lucide-react';
import { useT } from '@/lib/i18n';

function formatAction(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function AuditLogs() {
  const t = useT();
  const { logs, loading, error } = useAuditLogs();
  const { config } = useAppConfig();
  const actionColors = config?.audit_actions || {};
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const filtered = logs.filter((log) => {
    const matchesSearch = !searchTerm ||
      (log.staffName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.staffEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ipAddress || '').includes(searchTerm);
    const matchesAction = !actionFilter || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action))).sort();

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-white/40">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white/90">{t('Audit Logs')}</h1>
          <p className="text-sm text-white/40 mt-0.5">{t('Track every admin activity across the system.')}</p>
        </div>
      </div>

      {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg p-4">
          {t('Failed to load audit logs:')} {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('Search by staff name, email or IP...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="input-field pl-10 pr-8"
            >
              <option value="">{t('All Actions')}</option>
              {uniqueActions.map((a) => <option key={a} value={a}>{formatAction(a)}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/60">
            <thead className="text-sm text-white/40 uppercase bg-[#1A1C24] border-b border-white/[0.06]">
              <tr>
                <th className="px-6 py-4 font-medium">{t('Action')}</th>
                <th className="px-6 py-4 font-medium">{t('Staff')}</th>
                <th className="px-6 py-4 font-medium">{t('Details')}</th>
                <th className="px-6 py-4 font-medium">{t('IP Address')}</th>
                <th className="px-6 py-4 font-medium">{t('Time')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-[#1A1C24] transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 text-sm font-medium rounded-full ${actionColors[log.action] || 'bg-[#1E1E2E] text-white/70'}`}>
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white/90 font-medium">{log.staffName || 'System'}</div>
                    <div className="text-sm text-white/40">{log.staffEmail || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60">
                    {JSON.stringify(log.details || {}).substring(0, 100) || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/40">{log.ipAddress || '—'}</td>
                  <td className="px-6 py-4 text-sm text-white/40 whitespace-nowrap">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/40">{t('No audit logs found.')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

