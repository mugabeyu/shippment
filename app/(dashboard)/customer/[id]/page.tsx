'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCustomers, useShipments, useSettings, useAppConfig, useOffers } from '@/lib/swr';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Package,
  FileText,
  MessageCircle,
  Calendar,
  DollarSign
} from
  'lucide-react';
import { generateReceiptPDF, whatsappReceiptText } from '@/lib/exports';
import { useT } from '@/lib/i18n';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { customers, loading: customersLoading } = useCustomers();
  const { shipments, loading: shipmentsLoading } = useShipments();
  const { settings, loading: settingsLoading } = useSettings();
  const { config } = useAppConfig();
  const { offers } = useOffers();
  const customer = customers.find((c) => c.id === id);

  if (customersLoading || shipmentsLoading || settingsLoading) {
    return <div className="flex items-center justify-center h-64 text-white/40">{t('Loading customer details...')}</div>;
  }

  if (!customer) {
    return (
      <div className="space-y-5">
        <button onClick={() => router.push('/customers')} className="flex items-center text-amber-500 hover:text-amber-400 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('Back to Customers')}
        </button>
        <div className="card p-8 text-center text-white/40">
          {t('Customer not found.')}
        </div>
      </div>
    );
  }

  const customerShipments = shipments
    .filter((s) => s.customerId === customer.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalSpent = customerShipments.reduce(
    (acc, s) => acc + s.weightKg * (settings?.defaultRatePerKg || 0),
    0
  );

  const handlePDF = (shipmentId: string) => {
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (!shipment) return;
    const el = document.getElementById('receipt-root');
    if (el) generateReceiptPDF(el, shipment.trackingNumber);
  };
  const handleWhatsApp = (shipmentId: string) => {
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (!shipment || !settings) return;
    const text = whatsappReceiptText(shipment, settings);
    const url = `https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5">
      <button onClick={() => router.push('/customers')} className="flex items-center text-amber-500 hover:text-amber-400 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Customers
      </button>

      <div className="card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/[0.04] border-2 border-white/[0.06] flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-amber-500">
              {customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-white/90 mb-1">{customer.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-white/60">
              <span className="flex items-center"><Phone className="w-4 h-4 mr-2 text-white/25" />{customer.phone}</span>
              {customer.email && <span className="flex items-center"><Mail className="w-4 h-4 mr-2 text-white/25" />{customer.email}</span>}
            </div>
            {customer.address && (
              <div className="flex items-center mt-2 text-sm text-white/40">
                <MapPin className="w-4 h-4 mr-2 shrink-0" />
                <span>{customer.address}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2.5 text-center">
                <div className="text-sm font-medium text-white/40 uppercase tracking-wider">{t('Total KG')}</div>
                <div className="text-base font-bold text-white/90">{customer.totalKgSent} kg</div>
              </div>
              {(() => {
                const activeOffer = offers.find((o) => o.active);
                if (activeOffer && activeOffer.targetKg > 0) {
                  const totalKg = customer.totalKgSent || 0;
                  const milestonesCompleted = Math.floor(totalKg / activeOffer.targetKg);
                  const progressKg = Math.max(0, totalKg - milestonesCompleted * (activeOffer.targetKg + (activeOffer.rewardKg || 0)));
                  const kgNeeded = activeOffer.targetKg - progressKg;
                  return (
                    <div className="bg-white/[0.03] border border-emerald-500/20 rounded-lg px-4 py-2.5 text-center">
                      <div className="text-sm font-medium text-white/40 uppercase tracking-wider">{t('Free Offer Progress')}</div>
                      <div className="text-base font-bold text-emerald-400">{progressKg}/{activeOffer.targetKg} kg</div>
                       <div className="text-xs text-white/30">{kgNeeded} {t('kg to earn')} {activeOffer.rewardKg} kg {t('free')}</div>
                    </div>
                  );
                }
                return null;
              })()}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2.5 text-center">
                <div className="text-sm font-medium text-white/40 uppercase tracking-wider">{t('Shipments')}</div>
                <div className="text-base font-bold text-white/90">{customerShipments.length}</div>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2.5 text-center">
                <div className="text-sm font-medium text-white/40 uppercase tracking-wider">{t('Spent')}</div>
                <div className="text-base font-bold text-amber-500">{totalSpent.toLocaleString()} {settings?.currency || config?.defaults?.currency || 'MGA'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center">
          <Package className="w-5 h-5 text-amber-500 mr-2" />
          <h2 className="text-base font-semibold text-white/90">Shipments</h2>
        </div>
        {customerShipments.length === 0 ? (
          <div className="p-8 text-center text-white/40">{t('No shipments found for this customer.')}</div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {customerShipments.map((shipment) => (
              <div key={shipment.id} className="p-4 hover:bg-white/[0.03] transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-semibold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                        {shipment.trackingNumber}
                      </span>
                      <span className={`px-2.5 py-1 text-sm font-medium rounded-full ${shipment.status === 'Delivered' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          shipment.status === 'In Transit' ? 'bg-amber-100 text-amber-700' :
                            shipment.status === 'Cancelled' ? 'bg-red-100 text-red-400' :
                              'bg-white/[0.04] text-white/70'
                        }`}>
                        {shipment.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-white/60">
                      <span className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-white/25" />{shipment.date}</span>
                      <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1 text-white/25" />{(shipment.weightKg * (settings?.defaultRatePerKg || 0)).toLocaleString()} {settings?.currency || config?.defaults?.currency || 'MGA'}</span>
                      <span>{shipment.origin} &rarr; {shipment.destination}</span>
                      <span className="text-white/40">{shipment.category} - {shipment.description}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handlePDF(shipment.id)} title={t('Download PDF receipt')} className="p-2 text-white/40 hover:text-amber-500 transition-colors">
                      <FileText className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleWhatsApp(shipment.id)} title={t('Send receipt via WhatsApp')} className="p-2 text-white/40 hover:text-green-500 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
