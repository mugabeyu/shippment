'use client';

import { useState } from 'react';
import { useReceipts, useShipments, useCustomers } from '@/lib/swr';
import { Search, Eye } from 'lucide-react';

export default function Receipts() {
  const { receipts, loading } = useReceipts();
  const { shipments } = useShipments();
  const { customers } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');

  const enriched = receipts.map((r) => {
    const shipment = shipments.find((s) => s.id === r.shipmentId);
    const customer = customers.find((c) => c.id === r.customerId);
    return { ...r, shipment, customer };
  });

  const filtered = enriched.filter((r) =>
    (r.receiptNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.shipment?.trackingNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Loading receipts...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-navy-900">Receipts</h1>
          <p className="text-sm text-slate-500 mt-0.5">View and manage all shipment receipts.</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by receipt number, customer, or tracking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Receipt No</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Tracking</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-semibold text-navy-900">{r.receiptNumber}</span>
                  </td>
                  <td className="px-6 py-4">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4">
                    <div className="text-navy-900 font-medium">{r.customer?.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{r.customer?.phone || ''}</div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{r.shipment?.trackingNumber || '—'}</td>
                  <td className="px-6 py-4 font-medium text-navy-900">{r.total.toLocaleString()} {r.currency}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${r.sentViaWhatsapp ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.sentViaWhatsapp ? 'Sent' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => undefined} className="p-2 text-slate-400 hover:text-primary transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No receipts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

