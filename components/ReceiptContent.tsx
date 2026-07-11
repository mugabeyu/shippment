'use client';

import React from 'react';
import type { Shipment, Customer, Settings, Category, ShippingItem } from '@/lib/store';
import { formatLineItemQty } from '@/lib/lineItems';

interface ReceiptContentProps {
  shipment: Shipment;
  customer: Customer | undefined;
  settings: Settings | null;
  categories?: Category[];
  shippingItems?: ShippingItem[];
}

const ORANGE = '#D97706';
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY = '#E5E7EB';

export default function ReceiptContent({ shipment, customer, settings, categories = [], shippingItems = [] }: ReceiptContentProps) {
  const company = settings?.companyName || 'LA GRANDE MARQUE';
  const currency = settings?.currency || 'MGA';
  const lineItems = shipment.lineItems || [];

  const subtotal = shipment.basePrice ?? lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
  const discountAmount = shipment.discountAmount ?? 0;
  const finalAmount = shipment.finalAmount ?? Math.max(0, subtotal - discountAmount);
  const initialPayment = shipment.initialPayment ?? 0;
  const balanceDue = shipment.balanceDue ?? Math.max(0, finalAmount - initialPayment);

  const routeLabel = shipment.routeDirection === 'retour'
    ? 'Retour (Mauritius \u2192 Madagascar)'
    : 'Aller (Madagascar \u2192 Mauritius)';

  const totalWeight = lineItems.length > 0
    ? lineItems.reduce((sum, li) => sum + (li.weightKg != null ? li.weightKg * li.quantity : 0), 0)
    : (shipment.weightKg || 0);

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div
      className="p-6 rounded-2xl max-w-sm mx-auto"
      style={{ backgroundColor: WHITE, color: BLACK, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact', fontFamily: 'Arial, sans-serif' }}
    >
      {/* ============ HEADER ============ */}
      <div className="text-center mb-6">
        <h1 className="text-[22px] font-extrabold uppercase tracking-tight">
          <span style={{ color: BLACK }}>LA GRANDE </span>
          <span style={{ color: ORANGE }}>MARQUE</span>
        </h1>
        <p className="text-[11px] font-bold uppercase mt-1 tracking-wider" style={{ color: BLACK }}>
          Facture de transport
        </p>
      </div>

      {/* ============ META ============ */}
       <div className="text-[11px] leading-relaxed py-3 mb-5 border-t border-b " style={{ borderColor: GRAY, color: BLACK }}>
        <p><strong>ID No : </strong>#{shipment.idNo}</p>
        <p><strong>Track Id : </strong>{shipment.trackingNumber}</p>
        <p><strong>Date : </strong>{shipment.date}</p>
        <p className="mt-2"><strong>Client : </strong>{customer?.name || 'N/A'}</p>
        <p><strong>Tél : </strong>{customer?.phone || 'N/A'}</p>
        <p><strong>Route : </strong>{routeLabel}</p>
        <p><strong>Statut : </strong>
          <span style={{ color: shipment.paymentStatus === 'Paid' ? '#059669' : '#DC2626', fontWeight: 700 }}>
            {shipment.paymentStatus === 'Paid' ? 'Payé' : 'Non payé'}
          </span>
        </p>
      </div>

      {/* ============ LINE ITEMS ============ */}
      <div className="mb-5" style={{ color: BLACK }}>
        {lineItems.length > 0 ? (
          <div className="space-y-1.5 text-[11px] ">
            {lineItems.map((li, idx) => {
              return (
                <div key={li.id || idx} className="flex justify-between items-baseline">
                  <span>
                    {li.itemName} — {formatLineItemQty(li.weightKg, li.quantity)}
                  </span>
                  <span className="font-extrabold" style={{ color: BLACK }}>
                    {fmt(li.lineTotal)} {currency}
                  </span>
                </div>
              );
            })}
            <div className="text-[10px] font-normal pt-1" style={{ color: '#6B7280' }}>
              Poids total : {totalWeight} kg | {lineItems.length} article{lineItems.length > 1 ? 's' : ''}
            </div>
          </div>
        ) : (
          <div className="space-y-1 text-[11px] font-semibold">
            <div className="flex justify-between items-baseline">
              <span>{shipment.category || 'Colis'} — {shipment.weightKg} kg ({shipment.quantity})</span>
              <span className="font-extrabold">{fmt(subtotal)} {currency}</span>
            </div>
          </div>
        )}
      </div>

      {/* ============ TOTALS ============ */}
      <div className="text-[12px] font-semibold space-y-1.5 mb-6 pt-3 border-t" style={{ borderColor: GRAY, color: BLACK }}>
        <div className="flex justify-between">
          <span>Sous-total</span>
          <span className="font-bold">{fmt(subtotal)} {currency}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between" style={{ color: '#059669' }}>
            <span>Remise</span>
            <span className="font-bold">- {fmt(discountAmount)} {currency}</span>
          </div>
        )}

        {initialPayment > 0 && (
          <div className="flex justify-between" style={{ color: '#2563EB' }}>
            <span>Acompte versé</span>
            <span className="font-bold">- {fmt(initialPayment)} {currency}</span>
          </div>
        )}

        <div
          className="flex justify-between pt-2.5 mt-1 border-t-2 text-[13px]"
          style={{ borderColor: BLACK }}
        >
          <span className="uppercase font-extrabold tracking-wide">Solde à payer</span>
          <span className="font-extrabold text-base" style={{ color: ORANGE }}>
            {fmt(balanceDue)} {currency}
          </span>
        </div>
      </div>

      {/* ============ FOOTER ============ */}
      <div className="text-center text-[10px] pt-4 mt-6" style={{ borderTop: `1px solid ${GRAY}`, color: '#4B5563' }}>
        {settings?.phone && (
          <p className="font-bold mb-1">{`WhatsApp : ${settings.phone}`}</p>
        )}
        <p>Merci pour votre confiance</p>
      </div>
    </div>
  );
}
