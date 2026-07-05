import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { FileDown, FileText, Package, Users, Gift } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadCSV } from '../lib/exports';
type ReportType = 'shipments' | 'customers' | 'loyalty';
export function Reports() {
  const { shipments, customers, offers, settings } = useStore();
  const [type, setType] = useState<ReportType>('shipments');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const activeOffer = offers.find((o) => o.active) ?? offers[0];
  const target = activeOffer?.targetKg ?? 25;
  const filteredShipments = useMemo(
    () =>
    shipments.filter((s) => {
      if (from && s.date < from) return false;
      if (to && s.date > to) return false;
      return true;
    }),
    [shipments, from, to]
  );
  const { headers, rows, summary } = useMemo(() => {
    if (type === 'shipments') {
      return {
        headers: [
        'Tracking',
        'Date',
        'Customer',
        'Route',
        'Category',
        'Weight (kg)',
        'Status',
        'Payment'],

        rows: filteredShipments.map((s) => {
          const c = customers.find((cu) => cu.id === s.customerId);
          return [
          s.trackingNumber,
          s.date,
          c?.name ?? '',
          `${s.origin} -> ${s.destination}`,
          s.category,
          s.weightKg,
          s.status,
          s.paymentStatus] as
          (string | number)[];
        }),
        summary: [
        {
          label: 'Shipments',
          value: filteredShipments.length
        },
        {
          label: 'Total KG',
          value: filteredShipments.reduce((a, s) => a + s.weightKg, 0)
        },
        {
          label: `Revenue (${settings.currency})`,
          value: filteredShipments.
          reduce((a, s) => a + s.weightKg * settings.defaultRatePerKg, 0).
          toLocaleString()
        }]

      };
    }
    if (type === 'customers') {
      return {
        headers: ['Name', 'Phone', 'Email', 'Address', 'Total KG Sent'],
        rows: customers.map(
          (c) =>
          [c.name, c.phone, c.email, c.address, c.totalKgSent] as (
          string |
          number)[]

        ),
        summary: [
        {
          label: 'Customers',
          value: customers.length
        },
        {
          label: 'Total KG Sent',
          value: customers.reduce((a, c) => a + c.totalKgSent, 0)
        }]

      };
    }
    return {
      headers: ['Customer', 'Phone', 'Total KG', 'Rewards Earned', 'Progress'],
      rows: customers.map(
        (c) =>
        [
        c.name,
        c.phone,
        c.totalKgSent,
        Math.floor(c.totalKgSent / target),
        `${c.totalKgSent % target}/${target}kg`] as
        (string | number)[]
      ),
      summary: [
      {
        label: 'Total Rewards Earned',
        value: customers.reduce(
          (a, c) => a + Math.floor(c.totalKgSent / target),
          0
        )
      }]

    };
  }, [type, filteredShipments, customers, target, settings]);
  const exportCSV = () => downloadCSV(`${type}-report.csv`, [headers, ...rows]);
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(234, 179, 8);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `${settings.companyName.toUpperCase()} - ${type.toUpperCase()} REPORT`,
      14,
      15
    );
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const range =
    from || to ?
    `Range: ${from || '...'} to ${to || '...'}` :
    'Range: All time';
    doc.text(range, 14, 32);
    autoTable(doc, {
      startY: 38,
      head: [headers],
      body: rows.map((r) => r.map(String)),
      headStyles: {
        fillColor: [24, 24, 27],
        textColor: [234, 179, 8]
      },
      styles: {
        fontSize: 9,
        cellPadding: 2.5
      }
    });
    doc.save(`${type}-report.pdf`);
  };
  const tabs: {
    id: ReportType;
    label: string;
    icon: typeof Package;
  }[] = [
  {
    id: 'shipments',
    label: 'Shipments',
    icon: Package
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users
  },
  {
    id: 'loyalty',
    label: 'Loyalty',
    icon: Gift
  }];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Reports &amp; Exports</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportCSV}
            className="flex items-center px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium rounded-lg hover:bg-zinc-800 transition-colors">
            
            <FileDown className="w-5 h-5 mr-2" />
            CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center px-4 py-2 bg-yellow-500 text-zinc-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors">
            
            <FileText className="w-5 h-5 mr-2" />
            PDF
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${type === t.id ? 'bg-yellow-500/10 text-yellow-500' : 'text-zinc-400 hover:bg-zinc-800'}`}>
                
                <Icon className="w-4 h-4 mr-2" />
                {t.label}
              </button>);

          })}
        </div>
        {type === 'shipments' &&
        <div className="flex items-center gap-3">
            <label className="text-sm text-zinc-400">From</label>
            <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500" />
          
            <label className="text-sm text-zinc-400">To</label>
            <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500" />
          
          </div>
        }
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summary.map((s) =>
        <div
          key={s.label}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          
            <div className="text-sm text-zinc-400">{s.label}</div>
            <div className="text-2xl font-bold text-white mt-1">{s.value}</div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50 border-b border-zinc-800">
              <tr>
                {headers.map((h) =>
                <th key={h} className="px-6 py-4 font-medium">
                    {h}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((row, i) =>
              <tr key={i} className="hover:bg-zinc-800/50 transition-colors">
                  {row.map((cell, j) =>
                <td key={j} className="px-6 py-4">
                      {cell}
                    </td>
                )}
                </tr>
              )}
              {rows.length === 0 &&
              <tr>
                  <td
                  colSpan={headers.length}
                  className="px-6 py-8 text-center text-zinc-500">
                  
                    No data for this report.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}