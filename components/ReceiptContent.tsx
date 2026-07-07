'use client';

import React from 'react';
import type { Shipment, Customer, Settings, Category } from '@/lib/store';

interface ReceiptContentProps {
  shipment: Shipment;
  customer: Customer | undefined;
  settings: Settings | null;
  categories?: any[];
}

export default function ReceiptContent({ shipment, customer, settings, categories = [] }: ReceiptContentProps) {
  const company = settings?.companyName || 'La Grande Marque';
  const currency = settings?.currency || 'MGA';
  const initials = company.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const finalAmount = shipment.finalAmount ?? shipment.basePrice ?? (shipment.weightKg * (settings?.defaultRatePerKg || 0));
  const basePrice = shipment.basePrice ?? (shipment.weightKg * (settings?.defaultRatePerKg || 0));
  const discountAmount = shipment.discountAmount ?? 0;
  const categoryData = categories.find((c: any) => c.name === shipment.category);
  const ratePerKg = categoryData?.pricePerKg ?? settings?.defaultRatePerKg ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 pb-5 border-b border-white/[0.06]">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-navy-800 to-navy-900 flex items-center justify-center font-bold text-lg shrink-0 text-gold">
          {initials}
        </div>
        <div>
          <div className="font-bold text-white/90 text-lg">{company}</div>
          {settings?.phone && <div className="text-xs text-white/40">{settings.phone}</div>}
          {settings?.contactEmail && <div className="text-xs text-white/40">{settings.contactEmail}</div>}
          {settings?.address && <div className="text-xs text-white/25">{settings.address}</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-[11px] text-white/25 uppercase font-medium tracking-wider">Receipt No</span>
          <div className="font-semibold text-white/90 mt-0.5">{shipment.trackingNumber}</div>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-white/25 uppercase font-medium tracking-wider">Date</span>
          <div className="font-semibold text-white/90 mt-0.5">{shipment.date}</div>
        </div>
        <div>
          <span className="text-[11px] text-white/25 uppercase font-medium tracking-wider">Customer</span>
          <div className="font-semibold text-white/90 mt-0.5">{customer?.name || 'Unknown'}</div>
          {customer?.phone && <div className="text-xs text-white/40">{customer.phone}</div>}
        </div>
        <div className="text-right">
          <span className="text-[11px] text-white/25 uppercase font-medium tracking-wider">Status</span>
          <div className="mt-0.5">
            <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${shipment.paymentStatus === 'Paid' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'}`}>
              {shipment.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#1A1C24] rounded-xl border border-white/[0.06] p-4 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-white/40">Route</span>
          <span className="font-medium text-white/80">{shipment.origin} → {shipment.destination}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Category</span>
          <span className="font-medium text-white/80">{shipment.category}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Rate</span>
          <span className="font-medium text-white/80">{ratePerKg.toLocaleString()} {currency} / kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Description</span>
          <span className="font-medium text-white/80">{shipment.description}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Weight</span>
          <span className="font-medium text-white/80">{shipment.weightKg} kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Quantity</span>
          <span className="font-medium text-white/80">{shipment.quantity} items</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Payment Method</span>
          <span className="font-medium text-white/80">{shipment.paymentMethod}</span>
        </div>
      </div>

      <div className="bg-[#1A1C24] rounded-xl border border-white/[0.06] p-4 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-white/60">Subtotal</span>
          <span className="font-medium text-white/80">{basePrice.toLocaleString()} {currency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Discount</span>
          <span className={`font-medium ${discountAmount > 0 ? 'text-emerald-400' : 'text-white/25'}`}>
            {discountAmount > 0 ? `- ${discountAmount.toLocaleString()} ${currency}` : `0 ${currency}`}
          </span>
        </div>
        <div className="flex justify-between pt-2.5 border-t border-white/[0.06]">
          <span className="font-semibold text-white/90">Total</span>
          <span className="font-bold text-xl text-gold">{finalAmount.toLocaleString()} {currency}</span>
        </div>
      </div>

      <div className="text-center text-[11px] text-white/25 pt-2">
        Thank you for choosing {company} — Keep this receipt for reference
      </div>
    </div>
  );
}
