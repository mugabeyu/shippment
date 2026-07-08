'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import { useShipments, useCustomers, useOffers, useSettings, useAppConfig, useExpenses } from '@/lib/swr';
import { Package, TrendingUp, DollarSign, Clock, Trophy, ArrowUpRight, ArrowDownRight, Receipt, Zap } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell } from 'recharts';
import type { ComponentType } from 'react';

function calculateFinancials(shipments: any[], expenses: any[], settings: any, config: any) {
  const currency = settings?.currency || config?.defaults?.currency || 'MGA';
  const totalRevenue = shipments
    .filter((s) => s.paymentStatus === 'Paid')
    .reduce((sum, s) => sum + (s.finalAmount ?? s.basePrice ?? (s.weightKg * (settings?.defaultRatePerKg || 0))), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  return { totalRevenue, totalExpenses, netProfit, currency };
}

function AnimatedCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    const startTime = performance.now();
    let raf: number;
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    prev.current = value;
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

export default function Dashboard() {
  const { shipments, loading: shipmentsLoading } = useShipments();
  const { customers, loading: customersLoading } = useCustomers();
  const { offers } = useOffers();
  const { settings, loading: settingsLoading } = useSettings();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { config } = useAppConfig();

  const today = new Date().toISOString().split('T')[0];
  const totalShipments = shipments.length;
  const pendingDeliveries = shipments.filter((s) => s.status !== 'Delivered' && s.status !== 'Cancelled').length;
  const delivered = shipments.filter((s) => s.status === 'Delivered').length;
  const totalKg = shipments.reduce((acc, curr) => acc + curr.weightKg, 0);
  const financials = useMemo(() => calculateFinancials(shipments, expenses, settings, config), [shipments, expenses, settings, config]);
  const paidShipments = shipments.filter((s) => s.paymentStatus === 'Paid').length;
  const activeOffer = offers.find((o) => o.active) ?? offers[0];
  const target = activeOffer?.targetKg ?? config?.defaults?.loyaltyTargetKg ?? 25;
  const topCustomers = [...customers].sort((a, b) => b.totalKgSent - a.totalKgSent).slice(0, 5);
  const closeToBonus = customers.map((c) => ({ ...c, remaining: target - c.totalKgSent % target })).sort((a, b) => a.remaining - b.remaining).slice(0, 5);
  const monthly = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; name: string; kg: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, name: d.toLocaleString('en-US', { month: 'short' }), kg: 0, revenue: 0 });
    }
    const byKey = new Map(buckets.map((b) => [b.key, b]));
    shipments.forEach((s) => {
      const d = new Date(s.date);
      if (isNaN(d.getTime())) return;
      const bucket = byKey.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (bucket) {
        bucket.kg += s.weightKg;
        if (s.paymentStatus === 'Paid') bucket.revenue += (s.finalAmount ?? s.basePrice ?? s.weightKg * (settings?.defaultRatePerKg || 0));
      }
    });
    return buckets.map(({ name, kg, revenue }) => ({ name, kg, revenue }));
  }, [shipments, settings]);

  const currency = financials.currency;

  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    shipments.forEach(s => { m[s.status] = (m[s.status] || 0) + 1; });
    return Object.entries(m).map(([name, count]) => ({ name, count }));
  }, [shipments]);

  if (shipmentsLoading || customersLoading || settingsLoading || expensesLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="card-glow p-5">
              <div className="skeleton h-3 w-20 mb-3" />
              <div className="skeleton h-8 w-32 mb-2" />
              <div className="skeleton h-2 w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card-glow p-6"><div className="skeleton h-64 w-full" /></div>
          <div className="card-glow p-6"><div className="skeleton h-64 w-full" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fadeIn">
        <div>
          <h1 className="text-3xl md:text-4xl font-display text-white tracking-tight">DASHBOARD</h1>
          <p className="text-sm text-white/30 mt-0.5 uppercase tracking-[0.2em]">Live Operations Overview</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/30">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
          <span>System Online</span>
        </div>
      </div>

      {/* KPI Cards — staggered entrance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          value={<AnimatedCounter value={financials.totalRevenue} />}
          suffix={` ${currency}`}
          icon={DollarSign}
          accent="cyan"
          trend={`${paidShipments} paid shipments`}
          trendUp
          delay="stagger-1"
        />
        <KpiCard
          title="Total Expenses"
          value={<AnimatedCounter value={financials.totalExpenses} />}
          suffix={` ${currency}`}
          icon={Receipt}
          accent="pink"
          trend={`${expenses.length} entries`}
          delay="stagger-2"
        />
        <KpiCard
          title="Net Profit"
          value={<AnimatedCounter value={Math.abs(financials.netProfit)} />}
          suffix={` ${currency}`}
          icon={TrendingUp}
          accent={financials.netProfit >= 0 ? 'green' : 'pink'}
          trend={financials.netProfit >= 0 ? 'Profitable' : 'Loss'}
          trendUp={financials.netProfit >= 0}
          delay="stagger-3"
          prefix={financials.netProfit < 0 ? '-' : ''}
        />
        <KpiCard
          title="Pending"
          value={pendingDeliveries}
          suffix=""
          icon={Clock}
          accent="amber"
          trend={`${delivered} delivered`}
          delay="stagger-4"
          pulseDot
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-glow p-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl text-white tracking-tight">Monthly Volume</h2>
              <p className="text-sm text-white/25">Shipment KG over the last 7 months</p>
            </div>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} barSize={36}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D9FF" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#00D9FF" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1C24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#00D9FF', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="kg" fill="url(#barGrad)" radius={[6, 6, 0, 0]}>
                  {monthly.map((_, idx) => (
                    <Cell key={idx} className="animate-bar-grow" style={{ animationDelay: `${idx * 80}ms` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-glow p-6 animate-fadeIn">
          <h2 className="font-display text-xl text-white tracking-tight mb-1">Recent Activity</h2>
          <p className="text-sm text-white/25 mb-5">Latest 5 shipments</p>
          <div className="space-y-2">
            {shipments.slice(0, 5).map((shipment, i) => {
              const customer = customers.find((c) => c.id === shipment.customerId);
              return (
                <div
                  key={shipment.id}
                  className="group flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] transition-all duration-200 hover:bg-white/[0.05] hover:border-white/[0.08] hover:translate-x-1"
                  style={{ animation: `fadeIn 0.3s ease-out ${i * 0.06}s forwards`, opacity: 0 }}
                >
                  <div>
                    <div className="font-medium text-white/90 text-sm font-display tracking-wide">{shipment.trackingNumber}</div>
                    <div className="text-xs text-white/30">{customer?.name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${shipment.status === 'Delivered' ? 'badge-success' : shipment.status === 'Pending' ? 'badge-warning' : 'badge-info'}`}>
                      {shipment.status}
                    </span>
                    <span className="text-sm text-white/20 font-display">{shipment.weightKg}kg</span>
                  </div>
                </div>
              );
            })}
            {shipments.length === 0 && <div className="text-sm text-white/20 py-4 text-center">No shipments yet</div>}
          </div>
        </div>
      </div>

      {/* Top Customers + Bonus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fadeIn">
        <div className="card-glow p-6">
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-display text-xl text-white tracking-tight">Top Shippers</h2>
              <p className="text-sm text-white/25">By total volume</p>
            </div>
          </div>
          <div className="space-y-2">
            {topCustomers.map((c, i) => (
              <div
                key={c.id}
                className="group flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] transition-all duration-200 hover:bg-white/[0.05] hover:border-white/[0.08] hover:translate-x-1"
                style={{ animation: `fadeIn 0.3s ease-out ${0.2 + i * 0.06}s forwards`, opacity: 0 }}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    i === 1 ? 'bg-white/5 text-white/50 border border-white/10' :
                    i === 2 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                    'bg-white/[0.02] text-white/30 border border-white/[0.05]'
                  }`}>
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-white/90 font-medium text-sm">{c.name}</div>
                    <div className="text-xs text-white/25">{c.phone}</div>
                  </div>
                </div>
                <span className="font-display text-amber-400 font-semibold">{c.totalKgSent.toLocaleString()} kg</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-glow p-6">
          <h2 className="font-display text-xl text-white tracking-tight mb-1">Loyalty Progress</h2>
          <p className="text-sm text-white/25 mb-5">Next {target}kg bonus: {activeOffer?.rewardKg ?? 2}kg free</p>
          <div className="space-y-4">
            {closeToBonus.map((c, i) => {
              const progress = c.totalKgSent % target;
              const pct = Math.min(progress / target * 100, 100);
              return (
                <div key={c.id} style={{ animation: `fadeIn 0.3s ease-out ${0.2 + i * 0.06}s forwards`, opacity: 0 }}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/70 font-medium">{c.name}</span>
                    <span className={`font-display font-semibold ${c.remaining <= 5 ? 'text-amber-400' : 'text-white/20'}`}>
                      {progress} / {target} kg
                    </span>
                  </div>
                  <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.04]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, #F59E0B, ${c.remaining <= 5 ? '#FF3D81' : '#F59E0B'})`,
                        boxShadow: c.remaining <= 5 ? '0 0 12px rgba(255,61,129,0.3)' : '0 0 8px rgba(245,158,11,0.2)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, suffix = '', prefix = '', icon: Icon, accent, trend, trendUp, delay, pulseDot }: {
  title: string; value: React.ReactNode; suffix?: string; prefix?: string;
  icon: ComponentType<{ className?: string }>; accent: string; trend: string; trendUp?: boolean; delay?: string; pulseDot?: boolean;
}) {
  const glowMap: Record<string, string> = {
    cyan: 'glow-cyan', pink: 'glow-pink', green: 'glow-green', amber: 'glow-amber'
  };
  const iconBgMap: Record<string, string> = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20', pink: 'bg-pink-500/10 border-pink-500/20',
    green: 'bg-emerald-500/10 border-emerald-500/20', amber: 'bg-amber-500/10 border-amber-500/20'
  };
  const iconColorMap: Record<string, string> = {
    cyan: 'text-cyan-400', pink: 'text-pink-400', green: 'text-emerald-400', amber: 'text-amber-400'
  };

  return (
    <div className={`card-glow p-5 animate-fadeIn ${delay || ''} group ${glowMap[accent] || ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/25 uppercase tracking-[0.15em]">{title}</h3>
        <div className={`p-2 rounded-xl ${iconBgMap[accent] || 'bg-white/5 border-white/10'} border transition-all duration-300 group-hover:scale-110`}>
          {pulseDot ? (
            <div className="relative">
              <Icon className={`w-4 h-4 ${iconColorMap[accent] || 'text-white/50'}`} />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse-glow" />
            </div>
          ) : (
            <Icon className={`w-4 h-4 ${iconColorMap[accent] || 'text-white/50'}`} />
          )}
        </div>
      </div>
      <div className="font-display text-4xl font-bold text-white tracking-tight mb-1">
        {prefix}<>{value}</>{suffix}
      </div>
      <div className={`flex items-center text-sm ${trendUp ? 'text-emerald-400' : trend.includes('Loss') || trend.includes('entries') ? 'text-pink-400' : 'text-white/25'}`}>
        {trendUp && <ArrowUpRight className="w-4 h-4 mr-1" />}
        {!trendUp && trend.includes('Loss') && <ArrowDownRight className="w-4 h-4 mr-1" />}
        {trend}
      </div>
      {/* Sparkline bar */}
      <div className="mt-3 h-1 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${accent === 'cyan' ? 'bg-cyan-500' : accent === 'pink' ? 'bg-pink-500' : accent === 'green' ? 'bg-emerald-500' : 'bg-amber-500'}`}
          style={{ width: `${Math.min(100, trendUp ? 85 : 35)}%`, boxShadow: `0 0 8px ${accent === 'cyan' ? 'rgba(0,217,255,0.3)' : accent === 'pink' ? 'rgba(255,61,129,0.3)' : accent === 'green' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}` }}
        />
      </div>
    </div>
  );
}
