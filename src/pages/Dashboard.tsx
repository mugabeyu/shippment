import React, { Component } from 'react';
import { useStore } from '../store';
import { Package, TrendingUp, DollarSign, Clock, Trophy } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from
'recharts';
export function Dashboard() {
  const { shipments, customers, offers, settings } = useStore();
  const today = new Date().toISOString().split('T')[0];
  const totalShipments = shipments.length;
  const pendingDeliveries = shipments.filter(
    (s) => s.status !== 'Delivered' && s.status !== 'Cancelled'
  ).length;
  const totalKg = shipments.reduce((acc, curr) => acc + curr.weightKg, 0);
  const kgToday = shipments.
  filter((s) => s.date === today).
  reduce((a, s) => a + s.weightKg, 0);
  const revenue = totalKg * settings.defaultRatePerKg;
  const activeOffer = offers.find((o) => o.active) ?? offers[0];
  const target = activeOffer?.targetKg ?? 25;
  const topCustomers = [...customers].
  sort((a, b) => b.totalKgSent - a.totalKgSent).
  slice(0, 5);
  const closeToBonus = customers.
  map((c) => ({
    ...c,
    remaining: target - c.totalKgSent % target
  })).
  sort((a, b) => a.remaining - b.remaining).
  slice(0, 5);
  const monthly = [
  {
    name: 'Jan',
    kg: 120
  },
  {
    name: 'Feb',
    kg: 150
  },
  {
    name: 'Mar',
    kg: 180
  },
  {
    name: 'Apr',
    kg: 140
  },
  {
    name: 'May',
    kg: 210
  },
  {
    name: 'Jun',
    kg: 250
  },
  {
    name: 'Jul',
    kg: totalKg
  }];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Shipments"
          value={totalShipments.toString()}
          icon={Package}
          trend={`${kgToday} kg shipped today`} />
        
        <StatCard
          title="Total Volume"
          value={`${totalKg} kg`}
          icon={TrendingUp}
          trend="All-time" />
        
        <StatCard
          title="Revenue"
          value={`${revenue.toLocaleString()} ${settings.currency}`}
          icon={DollarSign}
          trend="Estimated" />
        
        <StatCard
          title="Pending Deliveries"
          value={pendingDeliveries.toString()}
          icon={Clock}
          trend="Needs attention"
          trendColor="text-yellow-500" />
        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Volume Trend (KG)
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  vertical={false} />
                
                <XAxis
                  dataKey="name"
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false} />
                
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false} />
                
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px'
                  }}
                  itemStyle={{
                    color: '#eab308'
                  }} />
                
                <Bar dataKey="kg" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Shipments
          </h2>
          <div className="space-y-3">
            {shipments.slice(0, 5).map((shipment) => {
              const customer = customers.find(
                (c) => c.id === shipment.customerId
              );
              return (
                <div
                  key={shipment.id}
                  className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  
                  <div>
                    <div className="font-medium text-zinc-200">
                      {shipment.trackingNumber}
                    </div>
                    <div className="text-sm text-zinc-500">
                      {customer?.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-yellow-500">
                      {shipment.status}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {shipment.weightKg} kg
                    </div>
                  </div>
                </div>);

            })}
            {shipments.length === 0 &&
            <div className="text-sm text-zinc-500">No shipments yet.</div>
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top customers */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
            Top Customers by Volume
          </h2>
          <div className="space-y-3">
            {topCustomers.map((c, i) =>
            <div
              key={c.id}
              className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800">
              
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-zinc-200 font-medium">{c.name}</div>
                    <div className="text-xs text-zinc-500">{c.phone}</div>
                  </div>
                </div>
                <div className="text-yellow-500 font-semibold">
                  {c.totalKgSent} kg
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Close to bonus */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Close to Next Bonus
          </h2>
          <div className="space-y-4">
            {closeToBonus.map((c) => {
              const progress = c.totalKgSent % target;
              const pct = Math.min(progress / target * 100, 100);
              return (
                <div key={c.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300">{c.name}</span>
                    <span className="text-zinc-500">
                      {c.remaining} kg to go
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{
                        width: `${pct}%`
                      }} />
                    
                  </div>
                </div>);

            })}
          </div>
        </div>
      </div>
    </div>);

}
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendColor = 'text-zinc-400'








}: {title: string;value: string;icon: ComponentType<{className?: string;}>;trend: string;trendColor?: string;}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-zinc-400 text-sm font-medium">{title}</h3>
        <div className="p-2 bg-yellow-500/10 rounded-lg">
          <Icon className="w-5 h-5 text-yellow-500" />
        </div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className={`text-sm ${trendColor}`}>{trend}</div>
    </div>);

}