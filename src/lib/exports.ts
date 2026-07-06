import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Customer, Settings, Shipment } from '../store';

/** Trigger a client-side download of CSV text. */
export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.
  map((row) =>
  row.
  map((cell) => {
    const value = String(cell ?? '');
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }).
  join(',')
  ).
  join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function receiptLines(
shipment: Shipment,
settings: Settings)
{
  const cost = shipment.finalAmount ?? shipment.basePrice ?? shipment.weightKg * settings.defaultRatePerKg;
  const baseCost = shipment.basePrice ?? shipment.weightKg * settings.defaultRatePerKg;
  const discount = shipment.discountAmount ?? 0;
  return {
    cost,
    baseCost,
    discount,
    fmtCost: `${cost.toLocaleString()} ${settings.currency}`,
    fmtBaseCost: `${baseCost.toLocaleString()} ${settings.currency}`,
    fmtDiscount: discount > 0 ? `- ${discount.toLocaleString()} ${settings.currency}` : null
  };
}

/** Generate and download a branded PDF receipt for a shipment. */
export function generateReceiptPDF(
shipment: Shipment,
customer: Customer | undefined,
settings: Settings)
{
  const doc = new jsPDF();
  const { fmtCost, fmtBaseCost, fmtDiscount } = receiptLines(shipment, settings);
  const rows = [
    ['Customer', customer?.name ?? 'Unknown'],
    ['Phone (Loyalty ID)', customer?.phone ?? '-'],
    ['Route', `${shipment.origin} \u2192 ${shipment.destination}`],
    ['Category', shipment.category],
    ['Description', shipment.description],
    ['Weight', `${shipment.weightKg} kg`],
    ['Quantity', `${shipment.quantity} item(s)`],
    ['Status', shipment.status],
    ['Payment', `${shipment.paymentStatus} (${shipment.paymentMethod})`]
  ];
  if (fmtDiscount) {
    rows.push(['Subtotal', fmtBaseCost]);
    rows.push(['Discount', fmtDiscount]);
  }
  rows.push(['Total', fmtCost]);

  autoTable(doc, {
    startY: 64,
    theme: 'grid',
    headStyles: { fillColor: [24, 24, 27], textColor: [234, 179, 8] },
    body: rows,

    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, fillColor: [244, 244, 245] }
    },
    styles: { fontSize: 10, cellPadding: 3 }
  });

  const endY = (doc as unknown as {lastAutoTable: {finalY: number;};}).
  lastAutoTable.finalY;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'Thank you for choosing us. Keep this receipt for tracking and pickup.',
    14,
    endY + 12
  );

  doc.save(`Receipt-${shipment.trackingNumber}.pdf`);
}

/** Build the WhatsApp receipt message text. */
export function whatsappReceiptText(
shipment: Shipment,
settings: Settings)
: string {
  const cost = shipment.finalAmount ?? shipment.basePrice ?? shipment.weightKg * settings.defaultRatePerKg;
  const baseCost = shipment.basePrice ?? shipment.weightKg * settings.defaultRatePerKg;
  const discount = shipment.discountAmount ?? 0;
  
  let text = (
    `*${settings.companyName.toUpperCase()} - RECEIPT*\n\n` +
    `Tracking: ${shipment.trackingNumber}\n` +
    `Date: ${shipment.date}\n` +
    `Route: ${shipment.origin} \u2192 ${shipment.destination}\n` +
    `Goods: ${shipment.category} (${shipment.description})\n` +
    `Weight: ${shipment.weightKg} kg\n` +
    `Quantity: ${shipment.quantity}\n` +
    `Status: ${shipment.status}\n` +
    `Payment: ${shipment.paymentStatus} - ${shipment.paymentMethod}\n`
  );
  
  if (discount > 0) {
    text += `Subtotal: ${baseCost.toLocaleString()} ${settings.currency}\n`;
    text += `Discount: - ${discount.toLocaleString()} ${settings.currency}\n`;
  }
  text += `Total: ${cost.toLocaleString()} ${settings.currency}\n\n`;
  text += `Thank you for choosing ${settings.companyName}!`;
  
  return text;
}