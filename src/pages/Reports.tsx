import { useMemo, useState } from 'react';
import { useShipments, useCustomers, useOffers, useSettings, useAppConfig } from '../hooks/useData';
import { FileDown, FileText, Package, Users, Gift } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadCSV } from '../lib/exports';

const ICON_MAP: Record<string, React.ComponentType<{className?: string}>> = {
  Package, Users, Gift
};

type ReportType = 'shipments' | 'customers' | 'loyalty';

export function Reports() {
  const { shipments, loading: shipmentsLoading } = useShipments();
  const { customers, loading: customersLoading } = useCustomers();
  const { offers } = useOffers();
  const { settings, loading: settingsLoading } = useSettings();
  const { config } = useAppConfig();

  const [type, setType] = useState<ReportType>('shipments');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const activeOffer = offers.find((o) => o.active) ?? offers[0];
  const target = activeOffer?.targetKg ?? config?.defaults?.loyaltyTargetKg ?? 25;
  const currency = settings?.currency || config?.defaults?.currency || 'MGA';
  const defaultValue = config?.defaults?.defaultRatePerKg || 0;

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
        headers: ['Tracking', 'Date', 'Customer', 'Route', 'Category', 'Weight (kg)', 'Status', 'Payment'],
        rows: filteredShipments.map((s) => {
          const c = customers.find((cu) => cu.id === s.customerId);
          return [s.trackingNumber, s.date, c?.name ?? '', `${s.origin} -> ${s.destination}`, s.category, s.weightKg, s.status, s.paymentStatus] as (string | number)[];
        }),
        summary: [
          { label: 'Shipments', value: filteredShipments.length },
          { label: 'Total KG', value: filteredShipments.reduce((a, s) => a + s.weightKg, 0) },
          { label: `Revenue (${currency})`, value: filteredShipments.reduce((a, s) => a + s.weightKg * (settings?.defaultRatePerKg || defaultValue), 0).toLocaleString() }
        ]
      };
    }
    if (type === 'customers') {
      return {
        headers: ['Name', 'Phone', 'Email', 'Address', 'Total KG Sent'],
        rows: customers.map((c) => [c.name, c.phone, c.email, c.address, c.totalKgSent] as (string | number)[]),
        summary: [
          { label: 'Customers', value: customers.length },
          { label: 'Total KG Sent', value: customers.reduce((a, c) => a + c.totalKgSent, 0) }
        ]
      };
    }
    return {
      headers: ['Customer', 'Phone', 'Total KG', 'Rewards Earned', 'Progress'],
      rows: customers.map((c) => [c.name, c.phone, c.totalKgSent, Math.floor(c.totalKgSent / target), `${c.totalKgSent % target}/${target}kg`] as (string | number)[]),
      summary: [
        { label: 'Total Rewards Earned', value: customers.reduce((a, c) => a + Math.floor(c.totalKgSent / target), 0) }
      ]
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
    doc.text(`${settings?.companyName?.toUpperCase() || 'LA GRANDE MARQUE'} - ${type.toUpperCase()} REPORT`, 14, 15);
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const range = from || to ? `Range: ${from || '...'} to ${to || '...'}` : 'Range: All time';
    doc.text(range, 14, 32);
    autoTable(doc, {
      startY: 38,
      head: [headers],
      body: rows.map((r) => r.map(String)),
      headStyles: { fillColor: [24, 24, 27], textColor: [234, 179, 8] },
      styles: { fontSize: 9, cellPadding: 2.5 }
    });
    doc.save(`${type}-report.pdf`);
  };

  const tabs: Array<{ id: ReportType; label: string; icon: React.ComponentType<{className?: string}> }> = ((config?.report_tabs || []) as Array<{ id: ReportType; label: string; icon: string }>).map((t) => ({
    ...t,
    icon: ICON_MAP[t.icon] || Package
  }));

  return (
    <div className="space-y-5">
      {(shipmentsLoading || customersLoading || settingsLoading) && (
        <div className="flex items-center justify-center h-64 text-slate-500">Loading reports...</div>
      )}
      {!(shipmentsLoading || customersLoading || settingsLoading) && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-lg font-semibold text-navy-900">Reports &amp; Exports</h1>
        <div className="flex items-center space-x-3">
          <button onClick={exportCSV} className="btn-secondary">
            <FileDown className="w-5 h-5 mr-2" /> CSV
          </button>
          <button onClick={exportPDF} className="btn-primary">
            <FileText className="w-5 h-5 mr-2" /> PDF
          </button>
        </div>
      </div>

      <div className="card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setType(t.id)} className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${type === t.id ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Icon className="w-4 h-4 mr-2" />{t.label}
              </button>
            );
          })}
        </div>
        {type === 'shipments' && (
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field" />
            <label className="text-sm text-slate-600">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summary.map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <div className="text-sm text-slate-600">{s.label}</div>
            <div className="text-xl font-semibold text-navy-900 mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>{headers.map((h) => <th key={h} className="px-6 py-4 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  {row.map((cell, j) => <td key={j} className="px-6 py-4">{cell}</td>)}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={headers.length} className="px-6 py-8 text-center text-slate-500">No data for this report.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
    )}
  </div>
  );
}
