'use client';

import React, { useState } from 'react';
import { useAuditLogs, useAppConfig } from '@/lib/swr';
import { Search, Filter, Activity as ActivityIcon, User, Clock } from 'lucide-react';
import { useT } from '@/lib/i18n';

function formatAction(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function summarizeDetails(details: Record<string, any> | null) {
  if (!details || Object.keys(details).length === 0) return '';
  return Object.entries(details)
    .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}: ${v}`)
    .join(' · ');
}

export default function Activity() {
  const t = useT();
  const { logs, loading, error } = useAuditLogs();
  const { config } = useAppConfig();
  const actionColors = config?.audit_actions || {};
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // The audit API returns snake_case keys; support both in case of future mapping.
  const staffName = (log: any) => log.staffName || log.staff_name || '';
  const staffEmail = (log: any) => log.staffEmail || log.staff_email || '';
  const createdAt = (log: any) => log.createdAt || log.created_at || '';
  const action = (log: any) => log.action || '';
  const details = (log: any) => log.details || null;

  const filtered = logs.filter((log) => {
    const matchesSearch = !searchTerm ||
      staffName(log).toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffEmail(log).toLowerCase().includes(searchTerm.toLowerCase()) ||
      action(log).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = !actionFilter || action(log) === actionFilter;
    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => action(l)))).sort();

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-white/40">Loading activity...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white/90">{t('Activity')}</h1>
          <p className="text-sm text-white/40 mt-0.5">{t('Every action performed across the system, and who did it.')}</p>
        </div>
      </div>

      {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg p-4">
          {t('Failed to load activity:')} {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('Search by staff name, email or action...')}
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

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-white/40">{t('No activity to display.')}</div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filtered.map((log) => (
              <div key={log.id || createdAt(log)} className="flex items-start gap-4 p-4 hover:bg-[#1A1C24] transition-colors">
                <div className={`p-2.5 rounded-lg shrink-0 ${actionColors[action(log)] || 'bg-[#1E1E2E] text-white/70'}`}>
                  <ActivityIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-white/90">{formatAction(action(log))}</h3>
                    <span className="flex items-center text-sm text-slate-400 shrink-0">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {createdAt(log) ? new Date(createdAt(log)).toLocaleString() : '—'}
                    </span>
                  </div>
                  {summarizeDetails(details(log)) && (
                    <p className="text-sm text-white/60 leading-relaxed">{summarizeDetails(details(log))}</p>
                  )}
                  <div className="flex items-center mt-1.5 text-sm text-white/40">
                    <User className="w-3.5 h-3.5 mr-1.5" />
                    <span className="font-medium text-white/70">{staffName(log) || 'System'}</span>
                    {staffEmail(log) && <span className="ml-1">({staffEmail(log)})</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
