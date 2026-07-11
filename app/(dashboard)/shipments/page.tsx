'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useShipments, useCustomers, useCategories, useSettings, useRoutes, useOffers, useAppConfig, useShippingItems, type Shipment, type ShipmentStatus } from '@/lib/swr';
import {
  Plus,
  Search,
  FileText,
  FileDown,
  Share2,
  Truck,
  Camera,
  Edit2,
  CheckCircle,
  X,
  Trash2,
  Download
} from 'lucide-react';
import {
  downloadCSV,
  generateReceiptPDF,
  generateReceiptBlob,
  whatsappReceiptText } from '@/lib/exports';
import { supabase } from '@/lib/supabase/client';
import ReceiptContent from '@/components/ReceiptContent';
import { useToast } from '@/lib/toast';
import { useT } from '@/lib/i18n';
import { formatLineItemQty } from '@/lib/lineItems';

export default function Shipments() {
  const t = useT();
  const router = useRouter();
  const { shipments, loading, error, addShipment, updateShipmentStatus } = useShipments();
  const { toast } = useToast();
  const { customers } = useCustomers();
  const { categories } = useCategories();
  const { settings } = useSettings();
  const { routes } = useRoutes();
  const { shippingItems } = useShippingItems();
  const { config } = useAppConfig();
  const { offers } = useOffers();
  const statuses: ShipmentStatus[] = (config?.shipment_statuses || []) as ShipmentStatus[];
  const filterStatuses = ['Pending', 'Delivered', ...(statuses.filter(s => !['Pending', 'Delivered', 'Cancelled'].includes(s)))] as ShipmentStatus[];
  const defaults = config?.defaults || {};

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ShipmentStatus>('All');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // --- New shipment state ---
  const [routeDirection, setRouteDirection] = useState<'aller' | 'retour'>('aller');
  const [customerId, setCustomerId] = useState('');
  const [description, setDescription] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Unpaid');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [initialPayment, setInitialPayment] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Line items
  const [lineItems, setLineItems] = useState<Array<{
    key: string;
    shippingItemId: string;
    itemName: string;
    categoryName: string;
    unitPrice: number;
    weightKg: number | null;
    quantity: number;
  }>>([]);

  // Add-item form state
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [addWeight, setAddWeight] = useState(1);
  const [addQty, setAddQty] = useState(1);

  // Line item key counter
  const [liCounter, setLiCounter] = useState(0);

  // --- Computed ---
  const activeOffer = offers.find((o) => o.active) ?? offers[0];

  // Items for selected category
  const itemsForCategory = useMemo(() => {
    if (!selectedCategoryId) return [];
    return shippingItems.filter((si) => si.categoryId === selectedCategoryId);
  }, [shippingItems, selectedCategoryId]);

  // When category changes, auto-select first item
  const [selectedShippingItemId, setSelectedShippingItemId] = useState('');
  useEffect(() => {
    const items = itemsForCategory;
    if (items.length === 1) {
      setSelectedShippingItemId(items[0].id);
    } else {
      setSelectedShippingItemId('');
    }
  }, [selectedCategoryId, itemsForCategory]);

  const selectedItem = useMemo(() => {
    return shippingItems.find((si) => si.id === selectedShippingItemId);
  }, [shippingItems, selectedShippingItemId]);

  const isPerKg = selectedItem?.categoryPricingMode === 'per_kg';

  // Pricing — items are billed flat per item (unitPrice x quantity) unless their
  // category is billed by weight (Kilograms category), in which case weightKg
  // multiplies in too.
  const lineItemsSubtotal = useMemo(() => {
    return lineItems.reduce((sum, li) => sum + (li.weightKg != null ? li.unitPrice * li.weightKg * li.quantity : li.unitPrice * li.quantity), 0);
  }, [lineItems]);

  const currentLineTotal = useMemo(() => {
    if (!selectedItem) return 0;
    const price = routeDirection === 'retour' ? (selectedItem.retourPrice ?? selectedItem.allerPrice) : selectedItem.allerPrice;
    return isPerKg ? price * addWeight * addQty : price * addQty;
  }, [selectedItem, routeDirection, addWeight, addQty, isPerKg]);

  // Only Kilograms-category lines carry billable weight — this is also what feeds
  // the customer's loyalty total_kg_sent below.
  const totalWeight = useMemo(() => {
    return lineItems.reduce((sum, li) => sum + (li.weightKg != null ? li.weightKg * li.quantity : 0), 0);
  }, [lineItems]);

  const offerDiscount = activeOffer
    ? activeOffer.discountPercent > 0
      ? Math.round(lineItemsSubtotal * (activeOffer.discountPercent / 100))
      : activeOffer.discountAmount > 0
        ? activeOffer.discountAmount
        : 0
    : 0;

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const customerPrevKg = selectedCustomer?.totalKgSent || 0;
  const customerNewKg = customerPrevKg + totalWeight;
  const targetKg = activeOffer?.targetKg || 0;
  const rewardKg = activeOffer?.rewardKg || 0;

  let targetDiscount = 0;
  let targetDiscountLabel = '';
  if (activeOffer && targetKg > 0 && rewardKg > 0) {
    const milestonesBefore = Math.floor(customerPrevKg / targetKg);
    const milestonesAfter = Math.floor(customerNewKg / targetKg);
    const earned = Math.max(0, milestonesAfter - milestonesBefore);
    if (earned > 0) {
      const avgPrice = lineItemsSubtotal > 0 ? Math.round(lineItemsSubtotal / Math.max(1, totalWeight)) : 0;
      targetDiscount = Math.round(rewardKg * earned * avgPrice);
      targetDiscountLabel = `${rewardKg * earned} kg free (${earned}× milestone)`;
    } else {
      const milestonesCompleted = milestonesAfter;
      const progressKg = Math.max(0, customerNewKg - milestonesCompleted * (targetKg + rewardKg));
      const kgNeeded = targetKg - progressKg;
      targetDiscountLabel = `Progress: ${progressKg}/${targetKg} kg (${kgNeeded} kg to earn ${rewardKg} kg free)`;
    }
  }

  const totalDiscount = offerDiscount + targetDiscount;
  const estimatedTotal = Math.max(0, lineItemsSubtotal - totalDiscount);
  const clampedInitialPayment = Math.min(Math.max(0, initialPayment), estimatedTotal);
  const balanceDue = Math.max(0, estimatedTotal - clampedInitialPayment);
  const currency = settings?.currency || defaults.currency || 'MGA';

  useEffect(() => {
    if (settings?.paymentMethods?.length) {
      setPaymentMethod(settings.paymentMethods[0]);
    } else if (defaults.paymentMethods?.length) {
      setPaymentMethod(defaults.paymentMethods[0]);
    }
  }, [settings?.paymentMethods, defaults.paymentMethods]);

  // --- Add line item ---
  const handleAddLineItem = () => {
    if (!selectedShippingItemId || !selectedItem) return;
    const price = routeDirection === 'retour' ? (selectedItem.retourPrice ?? selectedItem.allerPrice) : selectedItem.allerPrice;
    const key = `li-${liCounter}`;
    setLineItems((prev) => [...prev, {
      key,
      shippingItemId: selectedItem.id,
      itemName: selectedItem.item,
      categoryName: selectedItem.categoryName || '',
      unitPrice: price,
      weightKg: isPerKg ? addWeight : null,
      quantity: addQty,
    }]);
    setLiCounter((c) => c + 1);
    setSelectedCategoryId('');
    setSelectedShippingItemId('');
    setAddWeight(1);
    setAddQty(1);
  };

  const handleRemoveLineItem = (key: string) => {
    setLineItems((prev) => prev.filter((li) => li.key !== key));
  };

  // Quick status changes (status dropdown, "Mark Delivered" buttons) — always
  // go through this so a failure (e.g. no work session started) surfaces as a
  // toast instead of an unhandled promise rejection crashing the page.
  const handleQuickStatusChange = async (id: string, trackingNumber: string, status: ShipmentStatus) => {
    try {
      await updateShipmentStatus(id, status);
      toast('success', `${trackingNumber} → ${status}`);
    } catch (err: any) {
      toast('error', err?.message || 'Failed to update status');
    }
  };

  // --- Photo upload ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = 3 - photos.length;
    if (remaining <= 0) return;
    const toUpload = Array.from(files).slice(0, remaining);
    setUploadingPhotos(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of toUpload) {
        const fileExt = file.name.split('.').pop();
        const fileName = `shipments/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('photos').upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);
        if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl);
      }
      setPhotos((prev) => [...prev, ...uploadedUrls].slice(0, 3));
    } catch (err) { console.error('Photo upload failed', err); }
    finally { setUploadingPhotos(false); if (e.target) e.target.value = ''; }
  };

  // --- Create shipment ---
  const handleAddShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    if (lineItems.length === 0) return;
    try {
      // Tracking number is assigned server-side (A-01.. / R-01.. per route direction).
      const created = await addShipment({
        customerId,
        routeDirection,
        description,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        paymentStatus,
        paymentMethod,
        initialPayment: clampedInitialPayment,
        receiptSent: false,
        photos,
        lineItems: lineItems.map((li) => ({
          shippingItemId: li.shippingItemId,
          itemName: li.itemName,
          categoryName: li.categoryName,
          weightKg: li.weightKg,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        }))
      });
      if (targetDiscount > 0) {
        toast('success', `🎉 Milestone reached! ${rewardKg}kg free (-${targetDiscount.toLocaleString()} ${currency})`);
      } else {
        toast('success', `Shipment ${created?.trackingNumber ?? ''} created`);
      }
      setIsNewModalOpen(false);
      setCustomerSearch('');
      setShowCustomerDropdown(false);
      setCustomerId('');
      setRouteDirection('aller');
      setDescription('');
      setLineItems([]);
      setPhotos([]);
      setPaymentStatus('Unpaid');
      setInitialPayment(0);
      setSelectedCategoryId('');
      setSelectedShippingItemId('');
      setAddWeight(1);
      setAddQty(1);
    } catch (err: any) {
      toast('error', err?.message || 'Failed to create shipment');
    }
  };

  const filteredShipments = shipments.filter((s) => {
    const customer = customers.find((c) => c.id === s.customerId);
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      (s.trackingNumber || '').toLowerCase().includes(term) ||
      (customer?.name || '').toLowerCase().includes(term) ||
      String(s.idNo ?? '').includes(term) ||
      `#${s.idNo ?? ''}`.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Packed': return 'bg-blue-500 text-white border border-blue-400 shadow-md shadow-blue-500/40';
      case 'In Transit': return 'bg-amber-500 text-white border border-amber-400 shadow-md shadow-amber-500/40';
      case 'Delivered': return 'bg-emerald-500 text-white border border-emerald-400 shadow-md shadow-emerald-500/40';
      case 'Cancelled': return 'bg-red-500 text-white border border-red-400 shadow-md shadow-red-500/40';
      case 'Pending':
      default: return 'bg-white/15 text-white border border-white/25 shadow-md shadow-white/10';
    }
  };

  const [receiptShipment, setReceiptShipment] = useState<Shipment | null>(null);

  const handlePDF = async (shipment: Shipment) => {
    const el = document.getElementById('receipt-root');
    if (el) await generateReceiptPDF(el, shipment.trackingNumber);
  };

  const handleViewReceipt = (shipment: Shipment) => { setReceiptShipment(shipment); };

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
    } catch { const el = document.getElementById('receipt-root'); if (el) await generateReceiptPDF(el, receiptShipment?.trackingNumber || 'receipt'); }
  };

  const handleWhatsApp = async (shipment: Shipment) => {
    const customer = customers.find((c) => c.id === shipment.customerId);
    if (!customer || !settings) return;
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
      } catch { /* */ }
      const phone = customer.phone.replace(/[^0-9]/g, '');
      const text = whatsappReceiptText(shipment, settings);
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    }, 300);
  };

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['Tracking', 'Date', 'Customer', 'Phone', 'Route', 'Category', 'Weight (kg)', 'Qty', 'Status', 'Payment', 'Method'],
      ...filteredShipments.map((s) => {
        const c = customers.find((cu) => cu.id === s.customerId);
        return [s.trackingNumber, s.date, c?.name ?? '', c?.phone ?? '', s.routeDirection || `${s.origin}→${s.destination}`, s.category, s.weightKg, s.quantity, s.status, s.paymentStatus, s.paymentMethod];
      })
    ];
    downloadCSV('shipments.csv', rows);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-white/40">{t('Loading shipments...')}</div>;
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4">{t('Failed to load shipments:')} {error}</div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl font-semibold text-white/90">{t('Shipments')}</h1>
        <div className="flex items-center space-x-3">
          <button onClick={handleExportCSV} className="btn-secondary"><FileDown className="w-5 h-5 mr-2" />{t('Export CSV')}</button>
          <button onClick={() => setIsNewModalOpen(true)} className="btn-primary"><Plus className="w-5 h-5 mr-2" />{t('New Shipment')}</button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/25" />
            <input type="text" placeholder={t('Search by ID No, tracking number or customer...')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-10" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'All' | ShipmentStatus)} className="px-4 py-2.5 bg-[#12141C] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-primary transition-colors">
            <option value="All">{t('All Statuses')}</option>
            {filterStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-sm text-white/40 uppercase bg-white/[0.03] border-b border-white/[0.06]">
              <tr>
                <th className="px-6 py-4 font-medium">{t('ID No')}</th>
                <th className="px-6 py-4 font-medium">{t('Tracking')}</th>
                <th className="px-6 py-4 font-medium">{t('Customer')}</th>
                <th className="px-6 py-4 font-medium">{t('Route')}</th>
                <th className="px-6 py-4 font-medium">{t('Details')}</th>
                <th className="px-6 py-4 font-medium">{t('Status')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('Receipt')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredShipments.map((shipment) => {
                const customer = customers.find((c) => c.id === shipment.customerId);
                const photosArr = (shipment as any).photos || [];
                const lineItemsArr = shipment.lineItems || [];
                return (
                  <tr key={shipment.id} onClick={() => router.push(`/shipment/${shipment.id}`)} className="hover:bg-white/[0.03] hover:shadow-inner cursor-pointer transition-all duration-200">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center min-w-[2.25rem] px-2 py-1 rounded-lg bg-primary/10 text-primary font-bold text-sm border border-primary/20">#{shipment.idNo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white/90">{shipment.trackingNumber}</div>
                      <div className="text-sm text-white/40">{shipment.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white/80">{customer?.name}</div>
                      <div className="text-sm text-white/40">{customer?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-white/70">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${shipment.routeDirection === 'retour' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                          {shipment.routeDirection === 'retour' ? t('Retour') : t('Aller')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white/70">{shipment.category}</div>
                      <div className="text-sm text-white/40">{shipment.weightKg > 0 ? `${shipment.weightKg} kg • ` : ''}{lineItemsArr.length || shipment.quantity} items
                        {photosArr.length > 0 && <span className="ml-2">📎{photosArr.length}</span>}
                      </div>
                      {lineItemsArr.length > 0 && (
                        <div className="text-xs text-white/30 mt-1">
                          {lineItemsArr.slice(0, 3).map((li: any) => (
                            <span key={li.id || li.itemName}>{li.itemName} {formatLineItemQty(li.weightKg, li.quantity)}{lineItemsArr.indexOf(li) < Math.min(2, lineItemsArr.length - 1) ? ', ' : ''}</span>
                          ))}
                          {lineItemsArr.length > 3 && <span> +{lineItemsArr.length - 3} more</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1.5">
                        <select value={shipment.status} onChange={(e) => handleQuickStatusChange(shipment.id, shipment.trackingNumber, e.target.value as ShipmentStatus)} aria-label="Update status"
                          className={`px-2.5 py-1 rounded-full text-sm font-medium border-none outline-none cursor-pointer appearance-none hover:brightness-110 transition-all duration-200 ${getStatusColor(shipment.status)}`}>
                          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {shipment.status !== 'Delivered' && shipment.status !== 'Cancelled' && (
                          <button onClick={() => handleQuickStatusChange(shipment.id, shipment.trackingNumber, 'Delivered')}
                            className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-emerald-500/30">
                            {t('Mark Delivered')}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleViewReceipt(shipment)} className="p-2 text-white/25 hover:text-primary hover:scale-125 transition-all duration-200 rounded-lg hover:bg-white/[0.04]" title="View receipt"><FileText className="w-5 h-5" /></button>
                        <button onClick={() => handleWhatsApp(shipment)} className="p-2 text-white/25 hover:text-green-400 hover:scale-125 transition-all duration-200 rounded-lg hover:bg-white/[0.04]" title="WhatsApp"><Share2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredShipments.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-white/40">{t('No shipments found.')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Shipment Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setIsNewModalOpen(false)}>
          <div className="bg-[#12141C] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-white/[0.06] shrink-0">
              <h2 className="text-lg font-semibold text-white/90">{t('Create New Shipment')}</h2>
              <button onClick={() => setIsNewModalOpen(false)} aria-label="Close" className="text-white/40 hover:text-white/90 transition-colors p-1.5 rounded-xl hover:bg-white/[0.04]"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddShipment} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-5 overflow-y-auto flex-1 min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Customer */}
                  <Field label={t('Customer')}>
                    <div className="relative">
                      <input type="text" placeholder={t('Search customers...')} value={customerSearch}
                        onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                        onFocus={() => setShowCustomerDropdown(true)} className={modalInput} />
                      {showCustomerDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-[#12141C] border border-white/[0.10] rounded-xl shadow-2xl shadow-black/60 max-h-48 overflow-auto">
                          {customers.filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)).map((c) => (
                            <div key={c.id} onMouseDown={() => { setCustomerId(c.id); setCustomerSearch(c.name); setShowCustomerDropdown(false); }}
                              className={`px-3 py-2.5 cursor-pointer text-sm hover:bg-white/[0.06] transition-colors ${customerId === c.id ? 'bg-blue-500/15 text-blue-400 font-semibold' : 'text-white/80'}`}>
                              <div>{c.name}</div><div className="text-sm text-white/40">{c.phone}</div>
                            </div>
                          ))}
                          {customers.filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)).length === 0 && (
                            <div className="px-3 py-2.5 text-sm text-white/40">{t('No customers found')}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </Field>

                  {/* Route Direction */}
                  <Field label={t('Route Direction')}>
                    <select value={routeDirection} onChange={(e) => setRouteDirection(e.target.value as 'aller' | 'retour')} className={modalInput}>
                      <option value="aller">{t('Aller (Madagascar → Mauritius)')}</option>
                      <option value="retour">{t('Retour (Mauritius → Madagascar)')}</option>
                    </select>
                  </Field>

                  {/* Description */}
                  <Field label={t('Description of Goods')} full>
                    <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={`${modalInput} resize-none`} />
                  </Field>
                </div>

                {/* Line Items Section */}
                <div className="border-t border-white/[0.06] pt-4">
                  <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-3">{t('Line Items')}</h3>

                  {/* Add item row */}
                  <div className={`grid grid-cols-1 sm:grid-cols-2 ${isPerKg ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3 mb-3`}>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">{t('Category')}</label>
                      <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} className={modalInput}>
                        <option value="">Select...</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">{t('Item')}</label>
                      <select value={selectedShippingItemId} onChange={(e) => setSelectedShippingItemId(e.target.value)} className={modalInput} disabled={!selectedCategoryId}>
                        <option value="">Select...</option>
                        {itemsForCategory.map((si) => (
                          <option key={si.id} value={si.id}>{si.item}</option>
                        ))}
                      </select>
                    </div>
                    {isPerKg && (
                      <div>
                        <label className="block text-xs text-white/40 mb-1">{t('Weight (kg)')}</label>
                        <input type="number" min="1" step="0.01" value={addWeight} onChange={(e) => setAddWeight(Math.max(1, Number(e.target.value) || 1))} className={modalInput} />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-white/40 mb-1">{t('Quantity')}</label>
                      <input type="number" min="0.01" step="0.01" value={addQty} onChange={(e) => setAddQty(Math.max(0.01, Number(e.target.value) || 1))} className={modalInput} />
                    </div>
                    <div className="flex items-end">
                      <button type="button" onClick={handleAddLineItem} disabled={!selectedShippingItemId} className="btn-primary w-full disabled:opacity-40">
                        <Plus className="w-4 h-4 mr-1" /> {t('Add')}
                      </button>
                    </div>
                  </div>
                  {selectedItem && (
                    <div className="text-xs text-white/40 mb-3">
                      {isPerKg ? (
                        <>Current: {selectedItem.item} — {routeDirection === 'retour' ? (selectedItem.retourPrice ?? selectedItem.allerPrice) : selectedItem.allerPrice} {currency}/kg &times; {addWeight} kg &times; {addQty} qty = <span className="text-emerald-400 font-semibold">{currentLineTotal.toLocaleString()} {currency}</span></>
                      ) : (
                        <>Current: {selectedItem.item} — {routeDirection === 'retour' ? (selectedItem.retourPrice ?? selectedItem.allerPrice) : selectedItem.allerPrice} {currency}/item &times; {addQty} qty = <span className="text-emerald-400 font-semibold">{currentLineTotal.toLocaleString()} {currency}</span></>
                      )}
                    </div>
                  )}

                  {/* Line items list */}
                  {lineItems.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {lineItems.map((li) => (
                        <div key={li.key} className="flex items-center justify-between p-3 bg-[#1A1C24] border border-white/[0.06] rounded-lg text-sm">
                          <div className="flex-1 min-w-0">
                            <span className="text-white/80 font-medium">{li.itemName}</span>
                            <span className="text-white/40 ml-2">
                              — {formatLineItemQty(li.weightKg, li.quantity)} {li.unitPrice.toLocaleString()} {currency}
                              = <span className="text-emerald-400 font-semibold">{(li.weightKg != null ? li.unitPrice * li.weightKg * li.quantity : li.unitPrice * li.quantity).toLocaleString()} {currency}</span>
                            </span>
                          </div>
                          <button type="button" onClick={() => handleRemoveLineItem(li.key)} className="p-1 text-white/30 hover:text-red-500 shrink-0 ml-2">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-white/30 text-center py-4 border border-dashed border-white/[0.06] rounded-lg mb-3">
                      {t('No items added yet. Select a category, then an item, and click Add.')}
                    </div>
                  )}
                </div>

                {/* Photos */}
                <Field label={t('Goods Photos (up to 3)')} full>
                  <div className="space-y-3">
                    <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-white/[0.10] rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Camera className="w-5 h-5" />
                        <span>{uploadingPhotos ? t('Uploading...') : t('Click to upload (max 3)')}</span>
                      </div>
                      <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} disabled={uploadingPhotos || photos.length >= 3} className="hidden" />
                    </label>
                    {photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {photos.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img src={url} alt={`Shipment ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-white/[0.06]" />
                            <button type="button" onClick={() => setPhotos((prev) => prev.filter((p) => p !== url))}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>

                {/* Payment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label={t('Payment Method')}>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={modalInput}>
                      {settings?.paymentMethods?.map((m: string) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                  <Field label={t('Payment Status')}>
                    <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as 'Paid' | 'Unpaid')} className={modalInput}>
                      <option value="Unpaid">{t('Unpaid')}</option>
                      <option value="Paid">{t('Paid')}</option>
                    </select>
                  </Field>
                  <Field label={t('Advance (optional)')}>
                    <input
                      type="number"
                      min="0"
                      value={initialPayment}
                      onChange={(e) => setInitialPayment(Math.max(0, Number(e.target.value) || 0))}
                      className={modalInput}
                      placeholder="0"
                    />
                  </Field>
                </div>

                {/* Price Preview */}
                {lineItems.length > 0 && (
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                    <div className="text-sm font-medium text-white/40 mb-2 uppercase tracking-wider">{t('Price Preview')}</div>
                    <div className="space-y-1.5 text-sm">
                      {lineItems.map((li) => (
                        <div key={li.key} className="flex justify-between text-white/60">
                          <span>{li.itemName} — {formatLineItemQty(li.weightKg, li.quantity)}</span>
                          <span>{(li.weightKg != null ? li.unitPrice * li.weightKg * li.quantity : li.unitPrice * li.quantity).toLocaleString()} {currency}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-white/60 pt-1 border-t border-white/[0.06]">
                          <span>{t('Subtotal')}{totalWeight > 0 ? ` (${totalWeight} kg)` : ''}</span>
                        <span>{lineItemsSubtotal.toLocaleString()} {currency}</span>
                      </div>
                      {activeOffer ? (
                        <>
                          {activeOffer.discountPercent > 0 && (
                            <div className="flex justify-between text-emerald-400">
                              <span>{t('Offer discount')} ({activeOffer.discountPercent}%)</span>
                              <span>- {offerDiscount.toLocaleString()} {currency}</span>
                            </div>
                          )}
                          {activeOffer.discountAmount > 0 && (
                            <div className="flex justify-between text-emerald-400">
                              <span>{t('Offer discount')} (fixed)</span>
                              <span>- {activeOffer.discountAmount.toLocaleString()} {currency}</span>
                            </div>
                          )}
                        </>
                      ) : null}
                      {activeOffer && targetKg > 0 && rewardKg > 0 && (
                        <div className={`flex justify-between ${targetDiscount > 0 ? 'text-emerald-400 font-semibold' : 'text-white/40'}`}>
                          <span>Loyalty ({targetKg}kg→{rewardKg}kg free)</span>
                          <span>{targetDiscount > 0 ? `🎉 -${targetDiscount.toLocaleString()} ${currency}` : targetDiscountLabel}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-white/90 font-bold pt-2 border-t border-white/[0.06]">
                        <span>{t('Estimated total')}</span>
                        <span>{estimatedTotal.toLocaleString()} {currency}</span>
                      </div>
                      {clampedInitialPayment > 0 && (
                        <>
                          <div className="flex justify-between text-blue-400">
                            <span>{t('Initial payment')}</span>
                            <span>- {clampedInitialPayment.toLocaleString()} {currency}</span>
                          </div>
                          <div className="flex justify-between text-white/90 font-bold pt-1">
                            <span>{t('Balance due')}</span>
                            <span>{balanceDue.toLocaleString()} {currency}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-4 px-5 pb-5 flex justify-end space-x-3 border-t border-white/[0.06] shrink-0">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 text-white/40 hover:text-white/90 transition-colors rounded-xl">{t('Cancel')}</button>
                <button type="submit" className="btn-primary" disabled={uploadingPhotos || lineItems.length === 0}>
                  {t('Create Shipment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptShipment && (() => {
        const rc = receiptShipment;
        const cus = customers.find((cu) => cu.id === rc.customerId);
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setReceiptShipment(null)}>
            <div className="bg-[#12141C] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-navy-800 border-b border-white/10 px-5 py-4 flex items-center justify-between shrink-0">
                <div><h2 className="font-bold text-lg text-white">{t('Receipt')}</h2><p className="text-xs text-blue-300">{rc.trackingNumber}</p></div>
                <button onClick={() => setReceiptShipment(null)} className="text-white/60 hover:text-white hover:rotate-90 transition-all duration-300 p-1.5 rounded-xl hover:bg-white/10"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 overflow-y-auto flex-1" id="receipt-root">
                <ReceiptContent shipment={rc} customer={cus} settings={settings} categories={categories} shippingItems={shippingItems} />
              </div>
              <div className="px-5 py-4 border-t border-white/[0.08] flex gap-3 shrink-0">
                <button onClick={() => handleShareReceipt()} className="btn-secondary flex-1"><Share2 className="w-4 h-4 mr-2" /> {t('Share PDF')}</button>
                {rc.status !== 'Delivered' && rc.status !== 'Cancelled' && (
                  <button onClick={() => { handleQuickStatusChange(rc.id, rc.trackingNumber, 'Delivered'); setReceiptShipment(null); }}
                    className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700"><CheckCircle className="w-4 h-4 mr-2" /> Mark Delivered</button>
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
      <label className="text-sm font-medium uppercase tracking-wider text-white/40">{label}</label>
      {children}
    </div>
  );
}
