'use client';

import React from 'react';
import type { Shipment, Customer, Settings, Category } from '@/lib/store';

interface ReceiptContentProps {
  shipment: Shipment;
  customer: Customer | undefined;
  settings: Settings | null;
  categories?: Category[];
}

const ORANGE = '#D97706';
const INK = '#000000';
const PAPER = '#FFFFFF';
const HAIR = '#E5E7EB';

export default function ReceiptContent({ shipment, customer, settings, categories = [] }: ReceiptContentProps) {
  const company = settings?.companyName || 'La Grande Marque';
  const currency = settings?.currency || 'MGA';

  // 1. Calculations
  const categoryData = categories.find((c: Category) => c.name === shipment.category);
  const ratePerKg = categoryData?.pricePerKg ?? settings?.defaultRatePerKg ?? 0;
  const subtotal = shipment.basePrice ?? (shipment.weightKg * ratePerKg);
  const discountAmount = shipment.discountAmount ?? 0;
  const finalAmount = subtotal - discountAmount;

  return (
    <div
      className="p-8 rounded-3xl max-w-sm mx-auto shadow-sm border"
      style={{ backgroundColor: PAPER, color: INK, borderColor: HAIR, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold uppercase" style={{ color: ORANGE }}>{company}</h1>
        <p className="text-xs font-bold uppercase mt-1">Facture de transport</p>
      </div>

      {/* Meta: Includes Tracking, Date, Customer, Phone, Route */}
      <div className="text-sm py-3 mb-6 font-bold border-y" style={{ borderColor: HAIR }}>
        <p>N° {shipment.trackingNumber}</p>
        <p>{shipment.date}</p>
        <p className="mt-2">Client: {customer?.name || 'N/A'}</p>
        <p>Tél: {customer?.phone || 'N/A'}</p>
        <p>Route: {shipment.origin} → {shipment.destination}</p>
      </div>

      {/* Shipment Details: Organized as Category/Desc info */}
      <div className="mb-6 pb-4 border-b" style={{ borderColor: HAIR }}>
        <div className="space-y-1 font-bold text-sm">
          <div className="break-words">
            {shipment.category || 'Colis'} — {shipment.description || 'N/A'}
          </div>
          <div className="break-words">
            Poids: {shipment.weightKg} kg | Qté: {shipment.quantity} item(s)
          </div>
          <div className="break-words">
            Tarif: {ratePerKg.toLocaleString()} {currency}/kg
          </div>
        </div>
      </div>

      {/* Totals Section */}
      <div className="space-y-2 text-sm font-bold mb-8">
        <div className="flex justify-between">
          <span>Sous-total</span>
          <span>{subtotal.toLocaleString()} {currency}</span>
        </div>
        <div className="flex justify-between">
          <span>Remise (Universelle)</span>
          <span>- {discountAmount.toLocaleString()} {currency}</span>
        </div>

        {/* FINAL TOTAL - Bold & Large */}
        <div className="flex justify-between pt-4 border-t-2" style={{ borderColor: INK }}>
          <span className="text-lg uppercase">Total à payer</span>
          <span className="text-2xl" style={{ color: ORANGE }}>
            {finalAmount.toLocaleString()} {currency}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs mt-10 pt-4" style={{ borderTop: `1px solid ${HAIR}` }}>
        {settings?.phone && (
          <p className="font-bold mb-2">{`WhatsApp : ${settings.phone}`}</p>
        )}
        <p className="font-normal">Merci pour votre confiance</p>
      </div>
    </div>
  );
}