import React, { useState, Component } from 'react';
import { useStore, genId, type Shipment, type ShipmentStatus } from '../store';
import {
  Plus,
  Search,
  FileText,
  FileDown,
  MessageCircle,
  X } from
'lucide-react';
import {
  downloadCSV,
  generateReceiptPDF,
  whatsappReceiptText } from
'../lib/exports';
const STATUSES: ShipmentStatus[] = [
'Pending',
'Packed',
'In Transit',
'Delivered',
'Cancelled'];

export function Shipments() {
  const {
    shipments,
    customers,
    categories,
    settings,
    addShipment,
    updateShipmentStatus
  } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ShipmentStatus>(
    'All'
  );
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const emptyDraft = {
    customerId: '',
    origin: 'Madagascar',
    destination: 'Mauritius',
    category: '',
    weightKg: 0,
    quantity: 1,
    description: '',
    paymentStatus: 'Unpaid' as 'Paid' | 'Unpaid',
    paymentMethod: settings.paymentMethods[0] ?? 'Cash'
  };
  const [newShipment, setNewShipment] = useState(emptyDraft);
  const handleAddShipment = (e: React.FormEvent) => {
    e.preventDefault();
    addShipment({
      id: genId(),
      trackingNumber: `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
      ...newShipment,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    });
    setIsNewModalOpen(false);
    setNewShipment(emptyDraft);
  };
  const filteredShipments = shipments.filter((s) => {
    const customer = customers.find((c) => c.id === s.customerId);
    const matchesSearch =
    s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Packed':
        return 'bg-blue-500/10 text-blue-500';
      case 'In Transit':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'Delivered':
        return 'bg-green-500/10 text-green-500';
      case 'Cancelled':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-zinc-800 text-zinc-300';
    }
  };
  const handleWhatsApp = (shipment: Shipment) => {
    const customer = customers.find((c) => c.id === shipment.customerId);
    if (!customer) return;
    const text = whatsappReceiptText(shipment, settings);
    const url = `https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };
  const handlePDF = (shipment: Shipment) => {
    const customer = customers.find((c) => c.id === shipment.customerId);
    generateReceiptPDF(shipment, customer, settings);
  };
  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
    [
    'Tracking',
    'Date',
    'Customer',
    'Phone',
    'Origin',
    'Destination',
    'Category',
    'Weight (kg)',
    'Quantity',
    'Status',
    'Payment',
    'Method'],

    ...filteredShipments.map((s) => {
      const c = customers.find((cu) => cu.id === s.customerId);
      return [
      s.trackingNumber,
      s.date,
      c?.name ?? '',
      c?.phone ?? '',
      s.origin,
      s.destination,
      s.category,
      s.weightKg,
      s.quantity,
      s.status,
      s.paymentStatus,
      s.paymentMethod];

    })];

    downloadCSV('shipments.csv', rows);
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Shipments</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium rounded-lg hover:bg-zinc-800 transition-colors">
            
            <FileDown className="w-5 h-5 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center px-4 py-2 bg-yellow-500 text-zinc-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors">
            
            <Plus className="w-5 h-5 mr-2" />
            New Shipment
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by tracking number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors" />
            
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
            setStatusFilter(e.target.value as 'All' | ShipmentStatus)
            }
            className="px-4 py-2 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg focus:outline-none focus:border-yellow-500">
            
            <option value="All">All Statuses</option>
            {STATUSES.map((s) =>
            <option key={s} value={s}>
                {s}
              </option>
            )}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Tracking</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Route</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredShipments.map((shipment) => {
                const customer = customers.find(
                  (c) => c.id === shipment.customerId
                );
                return (
                  <tr
                    key={shipment.id}
                    className="hover:bg-zinc-800/50 transition-colors">
                    
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">
                        {shipment.trackingNumber}
                      </div>
                      <div className="text-xs">{shipment.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-200">{customer?.name}</div>
                      <div className="text-xs">{customer?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span>{shipment.origin}</span>
                        <span className="text-zinc-600">&rarr;</span>
                        <span>{shipment.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{shipment.category}</div>
                      <div className="text-xs">
                        {shipment.weightKg} kg &bull; {shipment.quantity} items
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={shipment.status}
                        onChange={(e) =>
                        updateShipmentStatus(
                          shipment.id,
                          e.target.value as ShipmentStatus
                        )
                        }
                        aria-label="Update status"
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border-none outline-none cursor-pointer appearance-none ${getStatusColor(shipment.status)}`}>
                        
                        {STATUSES.map((s) =>
                        <option key={s} value={s}>
                            {s}
                          </option>
                        )}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handlePDF(shipment)}
                          className="p-2 text-zinc-400 hover:text-yellow-500 transition-colors"
                          title="Download PDF receipt"
                          aria-label="Download PDF receipt">
                          
                          <FileText className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleWhatsApp(shipment)}
                          className="p-2 text-zinc-400 hover:text-green-500 transition-colors"
                          title="Send receipt via WhatsApp"
                          aria-label="Send receipt via WhatsApp">
                          
                          <MessageCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>);

              })}
              {filteredShipments.length === 0 &&
              <tr>
                  <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-zinc-500">
                  
                    No shipments found.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      {isNewModalOpen &&
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={() => setIsNewModalOpen(false)}>
        
          <div
          className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl my-8"
          onClick={(e) => e.stopPropagation()}>
          
            <div className="flex justify-between items-center p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">
                Create New Shipment
              </h2>
              <button
              onClick={() => setIsNewModalOpen(false)}
              aria-label="Close"
              className="text-zinc-400 hover:text-white transition-colors">
              
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddShipment} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Customer">
                  <select
                  required
                  value={newShipment.customerId}
                  onChange={(e) =>
                  setNewShipment({
                    ...newShipment,
                    customerId: e.target.value
                  })
                  }
                  className={modalInput}>
                  
                    <option value="">Select a customer...</option>
                    {customers.map((c) =>
                  <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                  )}
                  </select>
                </Field>
                <Field label="Category">
                  <select
                  required
                  value={newShipment.category}
                  onChange={(e) =>
                  setNewShipment({
                    ...newShipment,
                    category: e.target.value
                  })
                  }
                  className={modalInput}>
                  
                    <option value="">Select a category...</option>
                    {categories.map((c) =>
                  <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                  )}
                  </select>
                </Field>
                <Field label="Origin">
                  <select
                  value={newShipment.origin}
                  onChange={(e) =>
                  setNewShipment({
                    ...newShipment,
                    origin: e.target.value
                  })
                  }
                  className={modalInput}>
                  
                    <option value="Madagascar">Madagascar</option>
                    <option value="Mauritius">Mauritius</option>
                  </select>
                </Field>
                <Field label="Destination">
                  <select
                  value={newShipment.destination}
                  onChange={(e) =>
                  setNewShipment({
                    ...newShipment,
                    destination: e.target.value
                  })
                  }
                  className={modalInput}>
                  
                    <option value="Mauritius">Mauritius</option>
                    <option value="Madagascar">Madagascar</option>
                  </select>
                </Field>
                <Field label="Weight (KG)">
                  <input
                  required
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={newShipment.weightKg || ''}
                  onChange={(e) =>
                  setNewShipment({
                    ...newShipment,
                    weightKg: parseFloat(e.target.value)
                  })
                  }
                  className={modalInput} />
                
                </Field>
                <Field label="Quantity (Items)">
                  <input
                  required
                  type="number"
                  min="1"
                  value={newShipment.quantity || ''}
                  onChange={(e) =>
                  setNewShipment({
                    ...newShipment,
                    quantity: parseInt(e.target.value)
                  })
                  }
                  className={modalInput} />
                
                </Field>
                <Field label="Description of Goods" full>
                  <textarea
                  required
                  rows={2}
                  value={newShipment.description}
                  onChange={(e) =>
                  setNewShipment({
                    ...newShipment,
                    description: e.target.value
                  })
                  }
                  className={`${modalInput} resize-none`} />
                
                </Field>
                <Field label="Payment Method">
                  <select
                  value={newShipment.paymentMethod}
                  onChange={(e) =>
                  setNewShipment({
                    ...newShipment,
                    paymentMethod: e.target.value
                  })
                  }
                  className={modalInput}>
                  
                    {settings.paymentMethods.map((m) =>
                  <option key={m} value={m}>
                        {m}
                      </option>
                  )}
                  </select>
                </Field>
                <Field label="Payment Status">
                  <select
                  value={newShipment.paymentStatus}
                  onChange={(e) =>
                  setNewShipment({
                    ...newShipment,
                    paymentStatus: e.target.value as 'Paid' | 'Unpaid'
                  })
                  }
                  className={modalInput}>
                  
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </Field>
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-zinc-800">
                <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">
                
                  Cancel
                </button>
                <button
                type="submit"
                className="px-4 py-2 bg-yellow-500 text-zinc-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors">
                
                  Create Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>);

}
const modalInput =
'w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500';
function Field({
  label,
  full,
  children




}: {label: string;full?: boolean;children: React.ReactNode;}) {
  return (
    <div className={`space-y-2 ${full ? 'md:col-span-2' : ''}`}>
      <label className="text-sm font-medium text-zinc-400">{label}</label>
      {children}
    </div>);

}