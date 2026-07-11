'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useShipments, useCustomers, useSettings, useNotifications, useAppConfig, useShippingItems } from '@/lib/swr';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  FileText,
  Share2,
  MessageCircle,
  Truck,
  CheckCircle,
  XCircle,
  ClipboardList,
  Mail,
  Download,
  X,
  Trash2
} from 'lucide-react';
import { generateReceiptPDF, generateReceiptBlob, whatsappReceiptText } from '@/lib/exports';
import ReceiptContent from '@/components/ReceiptContent';
import { useToast } from '@/lib/toast';
import { useT } from '@/lib/i18n';
import { formatLineItemQty } from '@/lib/lineItems';

const ICON_MAP: Record<string, React.ComponentType<{className?: string}>> = {
  Package, ClipboardList, Truck, MapPin, CheckCircle, XCircle
};

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ComponentType<{className?: string}>;
}

export default function ShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { shipments, loading: shipmentsLoading, updateShipmentStatus, deleteShipment } = useShipments();
  const { customers } = useCustomers();
  const { settings, loading: settingsLoading } = useSettings();
  const { shippingItems } = useShippingItems();
  const { createNotification } = useNotifications();
  const { config } = useAppConfig();
  const { toast } = useToast();
  const timelineSteps: TimelineStep[] = (config?.timeline_steps || []).map((step: any) => ({
    ...step,
    icon: ICON_MAP[step.icon] || Package
  }));

  const shipment = shipments.find((s) => s.id === id);
  const lineItems = shipment?.lineItems || [];
  const currency = settings?.currency || 'MGA';
  const customer = shipment ? customers.find((c) => c.id === shipment.customerId) : undefined;
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [forceStatus, setForceStatus] = useState('');
  const [confirmForceStatus, setConfirmForceStatus] = useState(false);

  const isLoading = shipmentsLoading || settingsLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-white/40">Loading shipment details...</div>;
  }

  if (!shipment) {
    return (
      <div className="space-y-5">
        <button onClick={() => router.push('/shipments')} className="flex items-center text-primary hover:text-primary-400 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> {t('Back to Shipments')}
        </button>
        <div className="bg-white border border-white/[0.06] rounded-2xl p-8 text-center text-white/40">{t('Shipment not found.')}</div>
      </div>
    );
  }

  const statusIdx = timelineSteps.findIndex((s) => s.key === shipment.status);
  const basePrice = shipment.basePrice ?? shipment.weightKg * (settings?.defaultRatePerKg || 0);
  const discountAmount = shipment.discountAmount ?? 0;
  const finalAmount = shipment.finalAmount ?? Math.max(0, basePrice - discountAmount);
  const initialPayment = shipment.initialPayment ?? 0;
  const balanceDue = shipment.balanceDue ?? Math.max(0, finalAmount - initialPayment);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateShipmentStatus(shipment.id, newStatus as any);
      await createNotification({
        type: newStatus === 'Delivered' ? 'shipment_delivered' : newStatus === 'Cancelled' ? 'shipment_cancelled' : 'system',
        title: `Shipment ${newStatus}`,
        message: `Shipment ${shipment.trackingNumber} has been marked as ${newStatus}.`,
        staffId: localStorage.getItem('activeStaffEmail') || undefined
      });
      toast('success', `${shipment.trackingNumber} → ${newStatus}`);
    } catch (err: any) {
      toast('error', err?.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleForceStatus = async () => {
    if (!forceStatus) return;
    await handleStatusChange(forceStatus);
    setConfirmForceStatus(false);
    setForceStatus('');
  };

  const handlePDF = async () => {
    const el = document.getElementById('receipt-root');
    if (el) await generateReceiptPDF(el, shipment.trackingNumber);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteShipment(shipment.id);
      toast('success', `${shipment.trackingNumber} deleted`);
      router.push('/shipments');
    } catch (err: any) {
      toast('error', err?.message || 'Failed to delete shipment');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
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
    } catch {
      handlePDF();
    }
  };

  const handleWhatsApp = async () => {
    if (!customer || !settings) return;
    // Open receipt modal first to capture
    setShowReceipt(true);
    setTimeout(async () => {
      try {
        const el = document.getElementById('receipt-root');
        if (el) {
          const blob = await generateReceiptBlob(el);
          const file = new File([blob], `Receipt-${shipment.trackingNumber}.pdf`, { type: 'application/pdf' });
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: `Receipt ${shipment.trackingNumber}`, files: [file] });
          }
        }
      } catch { /* fallback */ }
      const phone = customer.phone.replace(/[^0-9]/g, '');
      const text = whatsappReceiptText(shipment, settings);
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    }, 300);
  };

  return (
    <div className="space-y-5">
      <button onClick={() => router.push('/shipments')} className="flex items-center text-primary hover:text-primary-400 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Shipments
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-sm border border-primary/20">#{shipment.idNo}</span>
            <h1 className="text-xl font-bold text-white/90">{shipment.trackingNumber}</h1>
          </div>
          <p className="text-sm text-white/40 mt-0.5">{t('Shipment details and status tracking')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowReceipt(true)} className="btn-primary">
            <FileText className="w-4 h-4 mr-2" /> {t('View Receipt')}
          </button>
          <button onClick={handleShareReceipt} className="btn-secondary">
            <Share2 className="w-4 h-4 mr-2" /> {t('Share')}
          </button>
          <button onClick={handleWhatsApp} className="btn-secondary">
            <MessageCircle className="w-4 h-4 mr-2" /> {t('WhatsApp')}
          </button>
          {shipment.status !== 'Delivered' && shipment.status !== 'Cancelled' && (
            <button
              onClick={() => handleStatusChange('Delivered')}
              disabled={isUpdating}
              className="px-4 py-2.5 text-sm font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-emerald-500/30 flex items-center gap-2 disabled:opacity-50">
              <CheckCircle className="w-4 h-4" /> {t('Mark Delivered')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <h3 className="text-base font-semibold text-white/90 mb-4">{t('Shipment Timeline')}</h3>
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#1E1E2E] -translate-y-1/2"></div>
              {timelineSteps.map((step, idx) => {
                const Icon = step.icon;
                const completed = idx <= statusIdx;
                const current = idx === statusIdx;
                return (
                  <div key={step.key} className="relative flex flex-col items-center z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${current ? 'bg-primary text-white ring-4 ring-primary/20' : completed ? 'bg-primary text-white' : 'bg-[#1E1E2E] text-white/25 border border-white/[0.06]'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-sm mt-2 font-medium ${current ? 'text-primary' : completed ? 'text-white/90' : 'text-white/25'}`}>{step.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium uppercase tracking-wider text-white/40 mb-2">{t('Update Status')}</label>
              <select
                value={shipment.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdating}
                className="input-field"
              >
                {timelineSteps.filter(s => s.key !== 'Cancelled').map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-base font-semibold text-white/90 mb-4">{t('Shipment Details')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium uppercase tracking-wider text-white/40 mb-1">{t('Route')}</label>
                <div className="flex items-center gap-2 text-sm text-white/90 bg-[#1A1C24] border border-white/[0.06] rounded-xl p-3">
                  <MapPin className="w-4 h-4 text-white/25" />
                  {shipment.routeDirection === 'retour' ? t('Retour (Mauritius → Madagascar)') : t('Aller (Madagascar → Mauritius)')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium uppercase tracking-wider text-white/40 mb-1">{t('Status')}</label>
                <div className="flex items-center gap-2 text-sm text-white/90 bg-[#1A1C24] border border-white/[0.06] rounded-xl p-3">
                  {shipment.status}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium uppercase tracking-wider text-white/40 mb-1">{t('Items')}</label>
                <div className="bg-[#1A1C24] border border-white/[0.06] rounded-xl p-3 space-y-2">
                  {lineItems.length > 0 ? lineItems.map((li: any, idx: number) => (
                    <div key={li.id || idx} className="flex justify-between text-sm text-white/80">
                      <span>{li.itemName} — {formatLineItemQty(li.weightKg, li.quantity)}</span>
                      <span className="text-white/50">{li.lineTotal.toLocaleString()} {currency}</span>
                    </div>
                  )) : (
                    <div className="text-sm text-white/80">
                      {shipment.category} — {shipment.weightKg} kg &times; {shipment.quantity} items
                    </div>
                  )}
                  {(lineItems.length > 0 ? lineItems.reduce((s: number, li: any) => s + (li.weightKg != null ? li.weightKg * li.quantity : 0), 0) : shipment.weightKg) > 0 && (
                    <div className="text-sm text-white/50 pt-1 border-t border-white/[0.06]">
                      Total: {lineItems.length > 0 ? lineItems.reduce((s: number, li: any) => s + (li.weightKg != null ? li.weightKg * li.quantity : 0), 0) : shipment.weightKg} kg
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium uppercase tracking-wider text-white/40 mb-1">{t('Date')}</label>
                <div className="flex items-center gap-2 text-sm text-white/90 bg-[#1A1C24] border border-white/[0.06] rounded-xl p-3">
                  <Calendar className="w-4 h-4 text-white/25" /> {shipment.date}
                </div>
              </div>
              {shipment.description && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium uppercase tracking-wider text-white/40 mb-1">{t('Description')}</label>
                  <p className="text-sm text-white/80 bg-[#1A1C24] border border-white/[0.06] rounded-xl p-3">{shipment.description}</p>
                </div>
              )}
              {shipment.specialInstructions && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium uppercase tracking-wider text-white/40 mb-1">{t('Special Instructions')}</label>
                  <p className="text-sm text-white/80 bg-[#1A1C24] border border-white/[0.06] rounded-xl p-3">{shipment.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-6">
            <h3 className="text-base font-semibold text-white/90 mb-4">{t('Customer')}</h3>
            {customer && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1E1E2E] border border-white/[0.06] flex items-center justify-center">
                    {customer.photo ? (
                      <img src={customer.photo} alt={customer.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-sm font-bold text-navy-700">{customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white/90">{customer.name}</div>
                    <div className="text-sm text-white/40">{customer.phone}</div>
                  </div>
                </div>
                {customer.address && (
                  <div className="flex items-start gap-2 text-sm text-white/60">
                    <MapPin className="w-4 h-4 text-white/25 mt-0.5 shrink-0" />
                    <span>{customer.address}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Mail className="w-4 h-4 text-white/25 shrink-0" />
                    <span>{customer.email}</span>
                  </div>
                )}
                  <button onClick={() => router.push(`/customer/${customer.id}`)} className="w-full mt-2 px-4 py-2 text-sm font-medium text-primary border border-primary/20 rounded-xl hover:bg-primary/5 hover:text-primary-400 transition-all duration-200 hover:scale-[1.02]">
                    {t('View Full Profile')}
                  </button>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-base font-semibold text-white/90 mb-4">{t('Payment')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">{t('Weight')}</span>
                <span className="font-medium text-white/90">{shipment.weightKg} kg</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">{t('Rate')}</span>
                <span className="font-medium text-white/90">{settings?.defaultRatePerKg?.toLocaleString()} {settings?.currency}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">{t('Method')}</span>
                <span className="font-medium text-white/90">{shipment.paymentMethod}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">{t('Discount')}</span>
                  <span className="font-medium text-emerald-400">- {discountAmount.toLocaleString()} {settings?.currency}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm pt-3 border-t border-white/[0.06]">
                <span className="text-white/60">{t('Total')}</span>
                <span className="font-bold text-white/90 text-lg">{finalAmount.toLocaleString()} {settings?.currency || 'MGA'}</span>
              </div>
              {initialPayment > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">{t('Initial payment')}</span>
                    <span className="font-medium text-blue-400">- {initialPayment.toLocaleString()} {settings?.currency}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="text-white/60">{t('Balance due')}</span>
                    <span className="font-bold text-white/90">{balanceDue.toLocaleString()} {settings?.currency}</span>
                  </div>
                </>
              )}
              <span className={`inline-flex items-center px-2.5 py-1 text-sm font-medium rounded-full ${shipment.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-200' : 'bg-amber-500/10 text-amber-400 border border-amber-200'}`}>
                {shipment.paymentStatus}
              </span>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-base font-semibold text-white/90 mb-4">{t('Internal Notes')}</h3>
            {isEditing ? (
              <div className="space-y-3">
                <textarea rows={3} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder={t('Add internal notes...')} className="input-field resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => { setIsEditing(false); }} className="px-3 py-2 text-sm text-white/40 hover:text-white transition-colors rounded-xl">{t('Cancel')}</button>
                  <button onClick={() => setIsEditing(false)} className="btn-primary">{t('Save Notes')}</button>
                </div>
              </div>
            ) : (
              <div onClick={() => { setEditNotes(shipment.internalNotes || ''); setIsEditing(true); }} className="cursor-pointer rounded-xl p-2 hover:bg-white/[0.03] transition-colors">
                <p className="text-sm text-white/40">{shipment.internalNotes || t('No notes yet. Click to add.')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6 border-red-500/20">
        <h3 className="text-base font-semibold text-red-400 mb-1">{t('Danger Zone')}</h3>
        <p className="text-sm text-white/40 mb-4">{t('Deleting a shipment permanently removes it and cannot be undone.')}</p>
        {confirmDelete ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-white/70">{t('Are you sure? This cannot be undone.')}</span>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2.5 text-sm font-bold bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-500 hover:to-red-400 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-red-500/30 disabled:opacity-50 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> {isDeleting ? t('Deleting...') : t('Yes, Delete')}
            </button>
            <button onClick={() => setConfirmDelete(false)} disabled={isDeleting} className="px-4 py-2.5 text-sm text-white/40 hover:text-white transition-colors rounded-xl">
              {t('Cancel')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2.5 text-sm font-bold border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 hover:scale-[1.02] transition-all duration-200 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> {t('Delete Shipment')}
          </button>
        )}

        <div className="mt-5 pt-5 border-t border-red-500/10">
          <h4 className="text-sm font-semibold text-red-400 mb-1">{t('Change Shipment Status')}</h4>
          <p className="text-sm text-white/40 mb-4">{t('Force this shipment to any status, including Cancelled. Use with care.')}</p>
          {confirmForceStatus ? (
            <div className="flex flex-wrap items-center gap-3">
              <select value={forceStatus} onChange={(e) => setForceStatus(e.target.value)} className="input-field w-auto">
                {(config?.shipment_statuses || []).map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                onClick={handleForceStatus}
                disabled={isUpdating || !forceStatus}
                className="px-4 py-2.5 text-sm font-bold bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-500 hover:to-red-400 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-red-500/30 disabled:opacity-50">
                {t('Confirm')}
              </button>
              <button onClick={() => { setConfirmForceStatus(false); setForceStatus(''); }} disabled={isUpdating} className="px-4 py-2.5 text-sm text-white/40 hover:text-white transition-colors rounded-xl">
                {t('Cancel')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setForceStatus(shipment.status); setConfirmForceStatus(true); }}
              className="px-4 py-2.5 text-sm font-bold border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 hover:scale-[1.02] transition-all duration-200">
              {t('Change Shipment Status')}
            </button>
          )}
        </div>
      </div>

      {showReceipt && shipment && (() => {
        const cus = customer;
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowReceipt(false)}>
            <div className="bg-[#12141C] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn" onClick={(e) => e.stopPropagation()}>
              <div className="bg-navy-800 border-b border-white/10 px-5 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-bold text-lg text-white">{t('Receipt')}</h2>
                  <p className="text-xs text-blue-300">{shipment.trackingNumber}</p>
                </div>
                <button onClick={() => setShowReceipt(false)} className="text-white/60 hover:text-white hover:rotate-90 transition-all duration-300 p-1.5 rounded-xl hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto flex-1" id="receipt-root">
                <ReceiptContent shipment={shipment} customer={cus} settings={settings} shippingItems={shippingItems} />
              </div>
              <div className="px-5 py-4 border-t border-white/[0.08] flex gap-3 shrink-0">
                <button onClick={handleShareReceipt} className="btn-secondary flex-1">
                  <Share2 className="w-4 h-4 mr-2" /> Share PDF
                </button>
                {shipment.status !== 'Delivered' && shipment.status !== 'Cancelled' && (
                  <button
                    onClick={() => { handleStatusChange('Delivered'); setShowReceipt(false); }}
                    disabled={isUpdating}
                    className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
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
