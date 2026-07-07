'use client';

import React, { useState, useEffect } from 'react';
import { useShipments, useCustomers, useCategories, useSettings, useRoutes, useOffers, useAppConfig, type Shipment, type ShipmentStatus } from '@/lib/swr';
import {
  Plus,
  Search,
  FileText,
  FileDown,
  Share2,
  MessageCircle,
  X,
  Camera,
  Image as ImageIcon,
  Download,
  CheckCircle
} from 'lucide-react';
import {
  downloadCSV,
  generateReceiptPDF,
  generateReceiptBlob,
  whatsappReceiptText } from '@/lib/exports';
import { supabase } from '@/lib/supabase/client';
import ReceiptContent from '@/components/ReceiptContent';
import { useToast } from '@/lib/toast';

export default function Shipments() {
  const { shipments, loading, error, addShipment, updateShipmentStatus } = useShipments();
  const { toast } = useToast();
  const { customers } = useCustomers();
  const { categories } = useCategories();
  const { settings } = useSettings();
  const { routes } = useRoutes();
  const { config } = useAppConfig();
  const { offers } = useOffers();
  const statuses: ShipmentStatus[] = (config?.shipment_statuses || []) as ShipmentStatus[];
  // Filter options: always include Pending + Delivered, never Cancelled
  const filterStatuses = ['Pending', 'Delivered', ...(statuses.filter(s => !['Pending', 'Delivered', 'Cancelled'].includes(s)))] as ShipmentStatus[];
  const defaults = config?.defaults || {};

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ShipmentStatus>('All');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [newShipment, setNewShipment] = useState({
    customerId: '',
    origin: defaults.origin || '',
    destination: defaults.destination || '',
    category: '',
    weightKg: 0,
    quantity: 1,
    description: '',
    paymentStatus: 'Unpaid' as 'Paid' | 'Unpaid',
    paymentMethod: settings?.paymentMethods?.[0] || defaults.paymentMethods?.[0] || 'Cash',
    photos: [] as string[]
  });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [receiptShipment, setReceiptShipment] = useState<Shipment | null>(null);

  const activeOffer = offers.find((o) => o.active) ?? offers[0];
  const categoryPricePerKg = categories.find((c) => c.name === newShipment.category)?.pricePerKg ?? null;
  const basePrice = (categoryPricePerKg || settings?.defaultRatePerKg || 0) * (newShipment.weightKg || 0) * (newShipment.quantity || 1);

  const offerDiscount = activeOffer
    ? activeOffer.discountPercent > 0
      ? Math.round(basePrice * (activeOffer.discountPercent / 100))
      : activeOffer.discountAmount > 0
        ? activeOffer.discountAmount
        : 0
    : 0;

  const shipmentWeight = (newShipment.weightKg || 0) * (newShipment.quantity || 1);
  const pricePerKg = (categoryPricePerKg || settings?.defaultRatePerKg || 0);

  // Cumulative loyalty: reward granted when lifetime kg crosses target milestone
  const selectedCustomer = customers.find((c) => c.id === newShipment.customerId);
  const customerPrevKg = selectedCustomer?.totalKgSent || 0;
  const customerNewKg = customerPrevKg + shipmentWeight;
  const targetKg = activeOffer?.targetKg || 0;
  const rewardKg = activeOffer?.rewardKg || 0;

  let targetDiscount = 0;
  let targetDiscountLabel = '';
  if (activeOffer && targetKg > 0 && rewardKg > 0) {
    const milestonesBefore = Math.floor(customerPrevKg / targetKg);
    const milestonesAfter = Math.floor(customerNewKg / targetKg);
    const earned = Math.max(0, milestonesAfter - milestonesBefore);
    const milestonesEarned = Math.min(1, earned);
    if (milestonesEarned > 0) {
      targetDiscount = Math.round(rewardKg * pricePerKg);
      targetDiscountLabel = `${rewardKg} kg free`;
    } else {
      const nextMilestone = (milestonesBefore + 1) * targetKg;
      const kgNeeded = nextMilestone - customerNewKg;
      targetDiscountLabel = `${customerNewKg}/${nextMilestone} kg (${kgNeeded > 0 ? kgNeeded : 0} more to earn ${rewardKg} kg free)`;
    }
  }
  const totalDiscount = offerDiscount + targetDiscount;
  const estimatedTotal = Math.max(0, basePrice - totalDiscount);
  const currency = settings?.currency || defaults.currency || 'MGA';

  useEffect(() => {
    console.log('[Price Debug]', {
      customerId: newShipment.customerId,
      basePrice,
      pricePerKg,
      offerDiscount,
      targetDiscount,
      totalDiscount,
      estimatedTotal,
      shipmentWeight,
      activeOffer: activeOffer ? { id: activeOffer.id, name: activeOffer.name, targetKg: activeOffer.targetKg, rewardKg: activeOffer.rewardKg } : null
    });
  }, [newShipment.customerId, newShipment.weightKg, newShipment.quantity, offerDiscount, targetDiscount, totalDiscount, estimatedTotal]);

  useEffect(() => {
    if (settings?.paymentMethods?.length) {
      setNewShipment((prev) => ({ ...prev, paymentMethod: settings.paymentMethods[0] }));
    } else if (defaults.paymentMethods?.length) {
      setNewShipment((prev) => ({ ...prev, paymentMethod: defaults.paymentMethods[0] }));
    }
  }, [settings?.paymentMethods, defaults.paymentMethods]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 3 - newShipment.photos.length;
    if (remaining <= 0) return;

    const toUpload = Array.from(files).slice(0, remaining);
    setUploadingPhotos(true);

    try {
      const uploadedUrls: string[] = [];
      for (const file of toUpload) {
        const fileExt = file.name.split('.').pop();
        const fileName = `shipments/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);
        if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl);
      }

      setNewShipment((prev) => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls].slice(0, 3)
      }));
    } catch (err) {
      console.error('Photo upload failed', err);
    } finally {
      setUploadingPhotos(false);
      if (e.target) e.target.value = '';
    }
  };

  const removePhoto = (url: string) => {
    setNewShipment((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p !== url)
    }));
  };

  const handleAddShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trackingNumber = `TRK-${Math.floor(1000 + Math.random() * 9000)}`;
    await addShipment({
      trackingNumber,
      customerId: newShipment.customerId,
      origin: newShipment.origin,
      destination: newShipment.destination,
      category: newShipment.category,
      weightKg: Math.max(1, newShipment.weightKg || 1),
      quantity: Math.max(1, newShipment.quantity || 1),
      description: newShipment.description,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      paymentStatus: newShipment.paymentStatus,
      paymentMethod: newShipment.paymentMethod,
      receiptSent: false,
      photos: newShipment.photos
    });
    if (targetDiscount > 0) {
      toast('success', `🎉 Customer reached ${targetKg}kg milestone! ${rewardKg}kg free applied (-${targetDiscount.toLocaleString()} ${currency})`);
    } else {
      toast('success', `Shipment ${trackingNumber} created successfully`);
    }
    setIsNewModalOpen(false);
    setCustomerSearch('');
    setShowCustomerDropdown(false);
    setNewShipment({
      customerId: '',
      origin: defaults.origin || '',
      destination: defaults.destination || '',
      category: '',
      weightKg: 0,
      quantity: 1,
      description: '',
      paymentStatus: 'Unpaid',
      paymentMethod: settings?.paymentMethods?.[0] || defaults.paymentMethods?.[0] || 'Cash',
      photos: []
    });
  };

  const filteredShipments = shipments.filter((s) => {
    const customer = customers.find((c) => c.id === s.customerId);
    const matchesSearch =
      (s.trackingNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Packed':        return 'bg-blue-500/15 text-blue-400 border border-blue-500/20';
      case 'In Transit':    return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
      case 'Delivered':     return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
      case 'Cancelled':     return 'bg-red-500/15 text-red-400 border border-red-500/20';
      case 'Pending':
      default:              return 'bg-white/[0.04] text-white/60 border border-white/[0.08]';
    }
  };

  const handlePDF = async (shipment: Shipment) => {
    const el = document.getElementById('receipt-root');
    if (el) await generateReceiptPDF(el, shipment.trackingNumber);
  };

  const handleViewReceipt = (shipment: Shipment) => {
    setReceiptShipment(shipment);
  };

  const handleShareReceipt = async () => {
    try {
      const el = document.getElementById('receipt-root');
      if (!el) return;
      const blob = await generateReceiptBlob(el);
      const file = new File([blob], `Receipt.pdf`, { type: 'application/pdf' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: 'Receipt', files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) {
      console.error('Share failed', err);
      const el = document.getElementById('receipt-root');
      if (el) await generateReceiptPDF(el, receiptShipment?.trackingNumber || 'receipt');
    }
  };

  const handleWhatsApp = async (shipment: Shipment) => {
    const customer = customers.find((c) => c.id === shipment.customerId);
    if (!customer || !settings) return;
    // Open receipt modal first to render the DOM, then capture
    setReceiptShipment(shipment);
    setTimeout(async () => {
      try {
        const el = document.getElementById('receipt-root');
        if (!el) return;
        const blob = await generateReceiptBlob(el);
        const file = new File([blob], `Receipt-${shipment.trackingNumber}.pdf`, { type: 'application/pdf' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: `Receipt ${shipment.trackingNumber}`, files: [file] });
        }
      } catch { /* fallback */ }
      // Also open WhatsApp text
      const phone = customer.phone.replace(/[^0-9]/g, '');
      const text = whatsappReceiptText(shipment, settings);
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    }, 300);
  };

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['Tracking', 'Date', 'Customer', 'Phone', 'Origin', 'Destination', 'Category', 'Weight (kg)', 'Quantity', 'Status', 'Payment', 'Method', 'Photos'],
      ...filteredShipments.map((s) => {
        const c = customers.find((cu) => cu.id === s.customerId);
        return [s.trackingNumber, s.date, c?.name ?? '', c?.phone ?? '', s.origin, s.destination, s.category, s.weightKg, s.quantity, s.status, s.paymentStatus, s.paymentMethod, (s as any).photos?.length ?? 0];
      })
    ];
    downloadCSV('shipments.csv', rows);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-white/40">Loading shipments...</div>;
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4">
          Failed to load shipments: {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-lg font-semibold text-white/90">Shipments</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="btn-secondary">
            <FileDown className="w-5 h-5 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            New Shipment
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/25" />
            <input
              type="text"
              placeholder="Search by tracking number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | ShipmentStatus)}
            className="px-4 py-2.5 bg-[#12141C] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-primary transition-colors">
            <option value="All">All Statuses</option>
            {filterStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-white/40 uppercase bg-white/[0.03] border-b border-white/[0.06]">
              <tr>
                <th className="px-6 py-4 font-medium">Tracking</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Route</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredShipments.map((shipment) => {
                const customer = customers.find((c) => c.id === shipment.customerId);
                const photos = (shipment as any).photos || [];
                return (
                  <tr key={shipment.id} className="hover:bg-white/[0.03] transition-all duration-200">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white/90">{shipment.trackingNumber}</div>
                      <div className="text-xs text-white/40">{shipment.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white/80">{customer?.name}</div>
                      <div className="text-xs text-white/40">{customer?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-white/70">
                        <span>{shipment.origin}</span>
                        <span className="text-white/25">&rarr;</span>
                        <span>{shipment.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white/70">{shipment.category}</div>
                      <div className="text-xs text-white/40">{shipment.weightKg} kg &bull; {shipment.quantity} items
                        {photos.length > 0 && <span className="ml-2">📎{photos.length}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <select
                          value={shipment.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as ShipmentStatus;
                            updateShipmentStatus(shipment.id, newStatus);
                            toast('success', `${shipment.trackingNumber} → ${newStatus}`);
                          }}
                          aria-label="Update status"
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border-none outline-none cursor-pointer appearance-none ${getStatusColor(shipment.status)}`}>
                          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {shipment.status !== 'Delivered' && shipment.status !== 'Cancelled' && (
                          <button
                            onClick={() => {
                              updateShipmentStatus(shipment.id, 'Delivered');
                              toast('success', `${shipment.trackingNumber} marked Delivered ✓`);
                            }}
                            className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-emerald-500/30"
                            title="Mark this shipment as delivered">
                            Mark Delivered
                          </button>
                        )}
                        {(shipment.status === 'Delivered' || shipment.status === 'Cancelled') && (
                          <span className="text-xs text-white/25 italic">✓ Finished</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewReceipt(shipment)}
                          className="p-2 text-white/25 hover:text-primary hover:scale-110 transition-all duration-200 rounded-lg hover:bg-white/[0.04]"
                          title="View receipt"
                          aria-label="View receipt">
                          <FileText className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleWhatsApp(shipment)}
                          className="p-2 text-white/25 hover:text-green-400 hover:scale-110 transition-all duration-200 rounded-lg hover:bg-white/[0.04]"
                          title="Share via WhatsApp"
                          aria-label="Share via WhatsApp">
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredShipments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-white/40">No shipments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setIsNewModalOpen(false)}>
          <div className="bg-[#12141C] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-white/[0.06] shrink-0">
              <h2 className="text-lg font-semibold text-white/90">Create New Shipment</h2>
              <button onClick={() => { setIsNewModalOpen(false); }} aria-label="Close" className="text-white/40 hover:text-white/90 transition-colors p-1.5 rounded-xl hover:bg-white/[0.04]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddShipment} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-5 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Customer">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className={modalInput}
                    />
                    {showCustomerDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-[#12141C] border border-white/[0.10] rounded-xl shadow-2xl shadow-black/60 max-h-48 overflow-auto">
                        {customers
                          .filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch))
                          .map((c) => (
                            <div
                              key={c.id}
                              onMouseDown={() => {
                                setNewShipment({ ...newShipment, customerId: c.id });
                                setCustomerSearch(c.name);
                                setShowCustomerDropdown(false);
                              }}
                              className={`px-3 py-2.5 cursor-pointer text-sm hover:bg-white/[0.06] transition-colors ${newShipment.customerId === c.id ? 'bg-blue-500/15 text-blue-400 font-semibold' : 'text-white/80'}`}
                            >
                              <div>{c.name}</div>
                              <div className="text-xs text-white/40">{c.phone}</div>
                            </div>
                          ))}
                        {customers.filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)).length === 0 && (
                          <div className="px-3 py-2.5 text-sm text-white/40">No customers found</div>
                        )}
                      </div>
                    )}
                    <select required value={newShipment.customerId} onChange={(e) => { setNewShipment({ ...newShipment, customerId: e.target.value }); setCustomerSearch(customers.find(c => c.id === e.target.value)?.name || ''); }} className={`${modalInput} mt-2`} style={{ display: 'none' }}>
                      <option value="">Select a customer...</option>
                      {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                    </select>
                  </div>
                </Field>
                <Field label="Category">
                  <select required value={newShipment.category} onChange={(e) => setNewShipment({ ...newShipment, category: e.target.value })} className={modalInput}>
                    <option value="">Select a category...</option>
                    {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Origin">
                  <select required value={newShipment.origin} onChange={(e) => setNewShipment({ ...newShipment, origin: e.target.value })} className={modalInput}>
                    <option value="">Select origin...</option>
                    {routes.map((r: any) => <option key={`from-${r.from}`} value={r.from}>{r.from}</option>)}
                  </select>
                </Field>
                <Field label="Destination">
                  <select required value={newShipment.destination} onChange={(e) => setNewShipment({ ...newShipment, destination: e.target.value })} className={modalInput}>
                    <option value="">Select destination...</option>
                    {routes.map((r: any) => <option key={`to-${r.to}`} value={r.to}>{r.to}</option>)}
                  </select>
                </Field>
                <Field label="Weight (KG)">
                  <input required type="number" min="1" step="1" value={newShipment.weightKg || ''} onChange={(e) => setNewShipment({ ...newShipment, weightKg: Math.max(1, parseInt(e.target.value) || 0) })} className={modalInput} />
                </Field>
                <Field label="Quantity (Items)">
                  <input required type="number" min="1" value={newShipment.quantity || ''} onChange={(e) => setNewShipment({ ...newShipment, quantity: Math.max(1, parseInt(e.target.value) || 0) })} className={modalInput} />
                </Field>
                <Field label="Description of Goods" full>
                  <textarea required rows={2} value={newShipment.description} onChange={(e) => setNewShipment({ ...newShipment, description: e.target.value })} className={`${modalInput} resize-none`} />
                </Field>
                <Field label="Goods Photos (up to 3)" full>
                  <div className="space-y-3">
                    <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Camera className="w-5 h-5" />
                        <span>{uploadingPhotos ? 'Uploading...' : 'Click to upload photos (max 3)'}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhotos || newShipment.photos.length >= 3}
                        className="hidden"
                      />
                    </label>
                    {newShipment.photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {newShipment.photos.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img src={url} alt={`Shipment ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-white/[0.06]" />
                            <button
                              type="button"
                              onClick={() => removePhoto(url)}
                              className="absolute top-1 right-1 p-1 bg-red-500/100 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-white/40">{newShipment.photos.length} / 3 photos uploaded</p>
                  </div>
                </Field>
                <Field label="Payment Method">
                  <select value={newShipment.paymentMethod} onChange={(e) => setNewShipment({ ...newShipment, paymentMethod: e.target.value })} className={modalInput}>
                    {settings?.paymentMethods?.map((m: string) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Payment Status">
                  <select value={newShipment.paymentStatus} onChange={(e) => setNewShipment({ ...newShipment, paymentStatus: e.target.value as 'Paid' | 'Unpaid' })} className={modalInput}>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </Field>
                <div className="md:col-span-2 bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                  <div className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Price Preview</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-white/60">
                      <span>Category rate</span>
                      <span>{(categoryPricePerKg || settings?.defaultRatePerKg || 0).toLocaleString()} {currency} / kg</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Weight</span>
                      <span>{newShipment.weightKg || 0} kg &times; {newShipment.quantity || 1} items</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Subtotal</span>
                      <span>{basePrice.toLocaleString()} {currency}</span>
                    </div>

                    {activeOffer ? (
                      <>
                        <div className="flex justify-between text-white/60">
                          <span>Active offer</span>
                          <span>{activeOffer.name}</span>
                        </div>
                        {activeOffer.discountPercent > 0 && (
                          <div className="flex justify-between text-emerald-400">
                            <span>Offer discount ({activeOffer.discountPercent}%)</span>
                            <span>- {offerDiscount.toLocaleString()} {currency}</span>
                          </div>
                        )}
                        {activeOffer.discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-400">
                            <span>Offer discount (fixed)</span>
                            <span>- {activeOffer.discountAmount.toLocaleString()} {currency}</span>
                          </div>
                        )}
                        {activeOffer.discountPercent === 0 && activeOffer.discountAmount === 0 && (
                          <div className="flex justify-between text-white/25">
                            <span>Offer discount</span>
                            <span>No percentage or fixed discount</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex justify-between text-white/25">
                        <span>Active offer</span>
                        <span>No active offer</span>
                      </div>
                    )}

                    {activeOffer && activeOffer.targetKg > 0 && activeOffer.rewardKg > 0 && (
                      <>
                        <div className="flex justify-between text-white/60">
                          <span>Customer lifetime kg</span>
                          <span>{customerPrevKg} kg shipped</span>
                        </div>
                        <div className={`flex justify-between ${targetDiscount > 0 ? 'text-emerald-400 font-semibold' : 'text-white/40'}`}>
                          <span>Target bonus (ship {targetKg}kg, get {rewardKg}kg free)</span>
                          <span>{targetDiscount > 0 ? `🎉 Earned! - ${targetDiscount.toLocaleString()} ${currency}` : targetDiscountLabel}</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between text-white/90 font-bold pt-2 border-t border-white/[0.06]">
                      <span>Estimated total</span>
                      <span>{estimatedTotal.toLocaleString()} {currency}</span>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              <div className="pt-4 px-5 pb-5 flex justify-end space-x-3 border-t border-white/[0.06] shrink-0">
                <button type="button" onClick={() => { setIsNewModalOpen(false); }} className="px-4 py-2 text-white/40 hover:text-white/90 transition-colors rounded-xl">Cancel</button>
                <button type="submit" className="btn-primary" disabled={uploadingPhotos}>Create Shipment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {receiptShipment && (() => {
        const rc = receiptShipment;
        const cus = customers.find((cu) => cu.id === rc.customerId);
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setReceiptShipment(null)}>
            <div className="bg-[#12141C] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn" onClick={(e) => e.stopPropagation()}>
              <div className="bg-navy-800 border-b border-white/10 px-5 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-bold text-lg text-white">Receipt</h2>
                  <p className="text-xs text-blue-300">{rc.trackingNumber}</p>
                </div>
                <button onClick={() => setReceiptShipment(null)} className="text-white/60 hover:text-white hover:rotate-90 transition-all duration-300 p-1.5 rounded-xl hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto flex-1" id="receipt-root">
                <ReceiptContent shipment={rc} customer={cus} settings={settings} categories={categories} />
              </div>
              <div className="px-5 py-4 border-t border-white/[0.08] flex gap-3 shrink-0">
                <button onClick={() => handleShareReceipt()} className="btn-secondary flex-1">
                  <Share2 className="w-4 h-4 mr-2" /> Share PDF
                </button>
                {rc.status !== 'Delivered' && rc.status !== 'Cancelled' && (
                  <button
                    onClick={() => {
                      updateShipmentStatus(rc.id, 'Delivered');
                      toast('success', `${rc.trackingNumber} marked Delivered ✓`);
                      setReceiptShipment(null);
                    }}
                    className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

const modalInput = 'w-full px-3 py-2.5 bg-[#12141C] border border-white/[0.10] rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 transition-all duration-200';

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-2 ${full ? 'md:col-span-2' : ''}`}>
      <label className="text-xs font-medium uppercase tracking-wider text-white/40">{label}</label>
      {children}
    </div>
  );
}
