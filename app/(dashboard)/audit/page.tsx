'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuditLogs, useAppConfig, useWorkSessions, useStaff, useShipments, useExpenses, useSettings } from '@/lib/swr';
import { Search, Filter, Clock, TrendingUp, TrendingDown, DollarSign, Calendar, Package, Users, Tag, Gift, UserPlus, Settings as SettingsIcon, ChevronRight } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { describeAudit, actionLabel, auditLogHref } from '@/lib/auditDescribe';
import { calculateFinancials } from '@/lib/financials';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function isSameDate(iso: string, dateStr: string) {
  if (!iso) return false;
  return iso.split('T')[0] === dateStr;
}

function inSessionWindow(iso: string, session: any) {
  if (!iso || !session) return false;
  const t = new Date(iso).getTime();
  const start = new Date(session.startedAt).getTime();
  const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
  return t >= start && t <= end;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ACTION_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  shipment: Package,
  customer: Users,
  category: Tag,
  shipping_item: Tag,
  offer: Gift,
  staff: UserPlus,
  expense: DollarSign,
  settings: SettingsIcon,
  work_session: Clock,
};

function iconForAction(action: string) {
  const prefix = Object.keys(ACTION_ICON_MAP).find((p) => action.startsWith(p));
  return prefix ? ACTION_ICON_MAP[prefix] : Package;
}

export default function StaffWork() {
  const t = useT();
  const router = useRouter();
  const { logs, loading: logsLoading, error } = useAuditLogs();
  const { config } = useAppConfig();
  const { sessions, loading: sessionsLoading } = useWorkSessions();
  const { staff } = useStaff();
  const { shipments } = useShipments();
  const { expenses } = useExpenses();
  const { settings } = useSettings();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(todayStr());
  const [staffFilter, setStaffFilter] = useState('');
  const [routeFilter, setRouteFilter] = useState<'all' | 'aller' | 'retour'>('all');
  const [sessionFilter, setSessionFilter] = useState(''); // '' = all work periods that day

  const filteredSessions = useMemo(() => {
    return sessions.filter((s: any) => {
      const matchesDate = isSameDate(s.startedAt, dateFilter);
      const matchesStaff = !staffFilter || s.staffId === staffFilter;
      return matchesDate && matchesStaff;
    });
  }, [sessions, dateFilter, staffFilter]);

  // If date/staff filters change underneath a selected period so it's no longer
  // in filteredSessions, this naturally comes back null and every computation
  // below falls back to whole-day scoping — no separate reset needed.
  const selectedSession = useMemo(
    () => filteredSessions.find((s: any) => s.id === sessionFilter) || null,
    [filteredSessions, sessionFilter]
  );

  // With a specific work period selected, everything is scoped tightly to that
  // one session (start click to end click) via the exact work_session_id every
  // shipment/expense is stamped with at creation. Without one selected, it
  // falls back to "the whole day" (every session matching date + staff).
  const dayShipments = useMemo(() => {
    return shipments.filter((s: any) => {
      const matchesPeriod = selectedSession
        ? s.workSessionId === selectedSession.id
        : isSameDate(s.createdAt, dateFilter) && (!staffFilter || s.createdBy === staffFilter);
      return matchesPeriod && (routeFilter === 'all' || s.routeDirection === routeFilter);
    });
  }, [shipments, dateFilter, staffFilter, routeFilter, selectedSession]);

  const dayExpenses = useMemo(() => {
    return expenses.filter((e: any) => selectedSession
      ? e.workSessionId === selectedSession.id
      : isSameDate(e.createdAt, dateFilter) && (!staffFilter || e.createdBy === staffFilter));
  }, [expenses, dateFilter, staffFilter, selectedSession]);

  const financials = useMemo(
    () => calculateFinancials(dayShipments, dayExpenses, settings, config),
    [dayShipments, dayExpenses, settings, config]
  );

  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch = !searchTerm ||
      (log.staffName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.staffEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      describeAudit(log.action, log.details).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = !actionFilter || log.action === actionFilter;
    // Customers (and anything else without a work_session_id column) are scoped
    // to a specific period by matching the acting staff + the session's time
    // window instead — logs always have both.
    const staffMember = staff.find((s: any) => s.id === staffFilter);
    const matchesScope = selectedSession
      ? log.staffEmail === selectedSession.staffEmail && inSessionWindow(log.createdAt, selectedSession)
      : isSameDate(log.createdAt, dateFilter) && (!staffFilter || log.staffEmail === staffMember?.email);
    return matchesSearch && matchesAction && matchesScope;
  });

  // Shipments/expenses are counted straight from the data (dayShipments/dayExpenses
  // above). Customers don't carry a created-by column, so that count comes from
  // the audit trail instead — filteredLogs is already scoped to the same period.
  const customersAddedToday = filteredLogs.filter((l: any) => l.action === 'customer_created').length;
  const shipmentsCreatedToday = dayShipments.length;
  const expensesLoggedToday = dayExpenses.length;
  const otherActionsToday = filteredLogs.filter((l: any) => !['shipment_created', 'customer_created', 'expense_created'].includes(l.action)).length;

  const scopeLabel = selectedSession
    ? `${formatTime(selectedSession.startedAt)} – ${selectedSession.endedAt ? formatTime(selectedSession.endedAt) : t('Active')}`
    : dateFilter;

  const uniqueActions = Array.from(new Set(logs.map((l: any) => l.action))).sort();

  if (logsLoading || sessionsLoading) {
    return <div className="flex items-center justify-center h-64 text-white/40">{t('Loading staff work...')}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white/90">{t('Staff Work')}</h1>
          <p className="text-sm text-white/40 mt-0.5">{t('Track staff work sessions, their actions, and financial performance per session.')}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg p-4">
          {t('Failed to load audit logs:')} {error}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-col md:flex-row flex-wrap gap-3 md:items-center">
        <div className="relative w-full md:w-56">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input-field pl-9" />
        </div>
        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className="input-field w-full md:w-56">
          <option value="">{t('All Staff')}</option>
          {staff.map((s: any) => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
        </select>
        <div className="flex w-full md:w-auto rounded-xl border border-white/[0.08] overflow-hidden shrink-0">
          {(['all', 'aller', 'retour'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRouteFilter(r)}
              className={`flex-1 md:flex-none px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${routeFilter === r ? 'bg-cyan-500/15 text-cyan-400' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'}`}
            >
              {r === 'all' ? t('All Routes') : r === 'aller' ? t('Aller') : t('Retour')}
            </button>
          ))}
        </div>
      </div>

      {/* Scope indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-white/30">{t('Showing')}:</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-medium">
          {selectedSession ? `${selectedSession.staffName || selectedSession.staffEmail} — ${scopeLabel}` : `${t('Whole day')} (${scopeLabel})`}
        </span>
        {selectedSession && (
          <button onClick={() => setSessionFilter('')} className="text-white/30 hover:text-white/70 transition-colors underline">
            {t('Clear')}
          </button>
        )}
      </div>

      {/* Financial summary for the current scope (whole day, or one work period) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-1"><TrendingUp className="w-4 h-4" /> {t('Total Revenue')}</div>
          <div className="text-xl font-bold text-white/90">{financials.totalRevenue.toLocaleString()} {financials.currency}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-1"><DollarSign className="w-4 h-4" /> {t('Total Expenses')}</div>
          <div className="text-xl font-bold text-white/90">{financials.totalExpenses.toLocaleString()} {financials.currency}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-1"><TrendingDown className="w-4 h-4" /> {t('Net Profit')}</div>
          <div className={`text-xl font-bold ${financials.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{financials.netProfit.toLocaleString()} {financials.currency}</div>
        </div>
        <div className="card p-4 flex flex-col justify-center">
          <span className={`inline-flex w-fit items-center px-2.5 py-1 rounded-full text-sm font-medium ${financials.netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {financials.netProfit >= 0 ? t('Profitable') : t('Loss')}
          </span>
        </div>
      </div>

      {/* Activity counts */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">{t('Activity')} — {scopeLabel}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={() => router.push('/shipments')} className="text-left p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-cyan-500/30 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2 text-cyan-400 mb-1"><Package className="w-4 h-4" /><span className="text-xs uppercase tracking-wider text-white/40">{t('Shipments Created')}</span></div>
            <div className="text-2xl font-bold text-white/90">{shipmentsCreatedToday}</div>
          </button>
          <button onClick={() => router.push('/customers')} className="text-left p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/30 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2 text-emerald-400 mb-1"><Users className="w-4 h-4" /><span className="text-xs uppercase tracking-wider text-white/40">{t('Customers Added')}</span></div>
            <div className="text-2xl font-bold text-white/90">{customersAddedToday}</div>
          </button>
          <button onClick={() => router.push('/expenses')} className="text-left p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-amber-500/30 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2 text-amber-400 mb-1"><DollarSign className="w-4 h-4" /><span className="text-xs uppercase tracking-wider text-white/40">{t('Expenses Logged')}</span></div>
            <div className="text-2xl font-bold text-white/90">{expensesLoggedToday}</div>
          </button>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center gap-2 text-white/40 mb-1"><Filter className="w-4 h-4" /><span className="text-xs uppercase tracking-wider text-white/40">{t('Other Actions')}</span></div>
            <div className="text-2xl font-bold text-white/90">{otherActionsToday}</div>
          </div>
        </div>
      </div>

      {/* Sessions — a compact, capped-height, clickable grid. Click a card to
          scope the whole page to that exact work period; click again (or
          "Clear" above) to go back to the whole day. Capped height + internal
          scroll means a busy day of many clock-ins can never push the
          activity feed below out of view. */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-base font-semibold text-white/90">{t('Work Periods')}</h3>
          <span className="text-sm text-white/30">{filteredSessions.length} {t('this day')}</span>
        </div>
        {filteredSessions.length === 0 ? (
          <div className="p-6 text-center text-white/40">{t('No work sessions found for this date.')}</div>
        ) : (
          <div className="p-4 max-h-72 overflow-y-auto">
            <p className="text-sm text-white/30 mb-2.5">{t('Click a period to see just that session\'s activity.')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredSessions.map((s: any) => {
                const isSelected = selectedSession?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSessionFilter(isSelected ? '' : s.id)}
                    className={`text-left p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isSelected ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-white/[0.02] border-white/[0.05] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-white/90 text-sm truncate">{s.staffName || s.staffEmail}</div>
                      <div className="text-sm text-white/40 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{formatTime(s.startedAt)} — {s.endedAt ? formatTime(s.endedAt) : t('Active')}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-1 text-xs font-medium rounded-full ${!s.endedAt ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-white/60'}`}>
                      {!s.endedAt ? t('Active') : t('Ended')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Activity feed */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('Search by staff name or activity...')}
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
              {uniqueActions.map((a: any) => <option key={a} value={a}>{actionLabel(a)}</option>)}
            </select>
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {filteredLogs.map((log: any) => {
            const Icon = iconForAction(log.action);
            const href = auditLogHref(log.action, log.details);
            const description = describeAudit(log.action, log.details);
            return (
              <div
                key={log.id}
                onClick={() => href && router.push(href)}
                className={`flex items-start gap-3 p-4 transition-colors ${href ? 'cursor-pointer hover:bg-[#1A1C24]' : ''}`}
              >
                <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0">
                  <Icon className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white/90">{actionLabel(log.action)}</span>
                    <span className="text-sm text-white/30 shrink-0">{log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : '—'}</span>
                  </div>
                  {description && <p className="text-sm text-white/60 mt-0.5">{description}</p>}
                  <p className="text-sm text-white/30 mt-1">{log.staffName || t('System')}</p>
                </div>
                {href && <ChevronRight className="w-4 h-4 text-white/20 shrink-0 mt-1.5" />}
              </div>
            );
          })}
          {filteredLogs.length === 0 && (
            <div className="px-6 py-8 text-center text-white/40">{t('No audit logs found.')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
