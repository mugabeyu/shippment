'use client';

import { useMemo } from 'react';
import { useShipments, useCustomers, useOffers, useSettings, useAppConfig } from '@/lib/swr';
import { Package, TrendingUp, DollarSign, Clock, Trophy, ArrowUpRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from 'recharts';
import type { ComponentType } from 'react';

export default function Dashboard() {
  const { shipments, loading: shipmentsLoading } = useShipments();
  const { customers, loading: customersLoading } = useCustomers();
  const { offers } = useOffers();
  const { settings, loading: settingsLoading } = useSettings();
  const { config } = useAppConfig();

  const today = new Date().toISOString().split('T')[0];
  const totalShipments = shipments.length;
  const pendingDeliveries = shipments.filter((s) => s.status !== 'Delivered' && s.status !== 'Cancelled').length;
  const delivered = shipments.filter((s) => s.status === 'Delivered').length;
  const totalKg = shipments.reduce((acc, curr) => acc + curr.weightKg, 0);
  const kgToday = shipments.filter((s) => s.date === today).reduce((a, s) => a + s.weightKg, 0);
  const revenue = totalKg * (settings?.defaultRatePerKg || 0);
  const activeOffer = offers.find((o) => o.active) ?? offers[0];
  const target = activeOffer?.targetKg ?? config?.defaults?.loyaltyTargetKg ?? 25;
  const topCustomers = [...customers].sort((a, b) => b.totalKgSent - a.totalKgSent).slice(0, 5);
  const closeToBonus = customers.map((c) => ({ ...c, remaining: target - c.totalKgSent % target })).sort((a, b) => a.remaining - b.remaining).slice(0, 5);
  const monthly = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; name: string; kg: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        name: d.toLocaleString('en-US', { month: 'short' }),
        kg: 0
      });
    }
    const byKey = new Map(buckets.map((b) => [b.key, b]));
    shipments.forEach((s) => {
      const d = new Date(s.date);
      if (isNaN(d.getTime())) return;
      const bucket = byKey.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (bucket) bucket.kg += s.weightKg;
    });
    return buckets.map(({ name, kg }) => ({ name, kg }));
  }, [shipments]);

  return (
    <div className="space-y-6">
      {(shipmentsLoading || customersLoading || settingsLoading) && (
        <div className="flex items-center justify-center h-64 text-slate-500">Loading dashboard...</div>
      )}
      {!(shipmentsLoading || customersLoading || settingsLoading) && (
        <>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Dashboard Overview</h1>
            <p className="text-sm text-slate-500 mt-1">Welcome back, here's what's happening today.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Shipments" value={totalShipments.toString()} icon={Package} trend={`${kgToday} kg shipped today`} trendUp />
            <StatCard title="Total Volume" value={`${totalKg} kg`} icon={TrendingUp} trend="All-time shipments" />
            <StatCard title="Revenue" value={`${revenue.toLocaleString()} ${settings?.currency || config?.defaults?.currency || 'MGA'}`} icon={DollarSign} trend="Estimated revenue" />
            <StatCard title="Pending Deliveries" value={pendingDeliveries.toString()} icon={Clock} trend={`${delivered} delivered`} trendColor="text-amber-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 card p-5">
              <h2 className="text-sm font-semibold text-navy-900 mb-4">Monthly Shipments (KG)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      itemStyle={{ color: '#2563EB' }}
                    />
                    <Bar dataKey="kg" fill="#2563EB" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-navy-900 mb-4">Recent Shipments</h2>
              <div className="space-y-2.5">
                {shipments.slice(0, 5).map((shipment) => {
                  const customer = customers.find((c) => c.id === shipment.customerId);
                  return (
                    <div key={shipment.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <div className="font-medium text-navy-900 text-sm">{shipment.trackingNumber}</div>
                        <div className="text-xs text-slate-500">{customer?.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-amber-600">{shipment.status}</div>
                        <div className="text-xs text-slate-500">{shipment.weightKg} kg</div>
                      </div>
                    </div>
                  );
                })}
                {shipments.length === 0 && <div className="text-sm text-slate-500">No shipments yet.</div>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-navy-900 mb-4 flex items-center"><Trophy className="w-4 h-4 text-amber-600 mr-2" />Top Customers by Volume</h2>
              <div className="space-y-2.5">
                {topCustomers.map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                      <div>
                        <div className="text-navy-900 font-medium text-sm">{c.name}</div>
                        <div className="text-[11px] text-slate-500">{c.phone}</div>
                      </div>
                    </div>
                    <div className="text-amber-600 font-semibold text-sm">{c.totalKgSent} kg</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-navy-900 mb-4">Close to Next Bonus</h2>
              <div className="space-y-3">
                {closeToBonus.map((c) => {
                  const progress = c.totalKgSent % target;
                  const pct = Math.min(progress / target * 100, 100);
                  return (
                    <div key={c.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className=" text-navy-900">{c.name}</span>
                        <span className=" text-slate-500">{c.remaining} kg to go</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendColor = 'text-slate-500', trendUp }: { title: string; value: string; icon: ComponentType<{ className?: string }>; trend: string; trendColor?: string; trendUp?: boolean }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</h3>
        <div className="p-1.5 bg-primary/10 rounded-md">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="text-2xl font-bold text-navy-900 mb-0.5">{value}</div>
      <div className={`flex items-center text-xs ${trendColor}`}>
        {trendUp && <ArrowUpRight className="w-3 h-3 mr-1 text-green-600" />}
        {trend}
      </div>
    </div>
  );
}

