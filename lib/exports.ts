import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Customer, Settings, Shipment } from './store';

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
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const company = settings.companyName || 'La Grande Marque';
  const { fmtCost, fmtBaseCost, fmtDiscount } = receiptLines(shipment, settings);

  // --- Watermark: company name, faint and rotated, drawn first so content sits on top ---
  doc.setTextColor(236, 236, 240);
  doc.setFontSize(42);
  const watermark = company.toUpperCase();
  for (let gx = 24; gx < pageW; gx += 78) {
    for (let gy = 40; gy < pageH; gy += 58) {
      doc.text(watermark, gx, gy, { angle: 45, align: 'center' });
    }
  }

  // --- Header: monogram logo + company name + contact ---
  const initials = (company.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('') || 'LGM').toUpperCase();
  doc.setFillColor(24, 24, 27);
  doc.circle(margin + 9, 20, 9, 'F');
  doc.setTextColor(234, 179, 8);
  doc.setFontSize(12);
  doc.text(initials, margin + 9, 23.5, { align: 'center' });
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(company, margin + 22, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 115);
  const contact = [settings.phone, settings.contactEmail, settings.address].filter(Boolean).join('   |   ');
  doc.text(contact, margin + 22, 24);

  // Divider
  doc.setDrawColor(230, 230, 235);
  doc.line(margin, 32, pageW - margin, 32);

  // Receipt meta (right aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 27);
  doc.text('RECEIPT', pageW - margin, 43, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 115);
  doc.text(`No: ${shipment.trackingNumber}`, pageW - margin, 49, { align: 'right' });
  doc.text(`Date: ${shipment.date}`, pageW - margin, 54, { align: 'right' });

  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(24, 24, 27);
  doc.text('Bill To', margin, 47);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(customer?.name ?? 'Unknown', margin, 53);
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 115);
  doc.text(`Phone: ${customer?.phone ?? '-'}`, margin, 58);

  // Details table
  const rows = [
    ['Route', `${shipment.origin} to ${shipment.destination}`],
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
    startY: 66,
    theme: 'grid',
    head: [['Detail', 'Value']],
    headStyles: { fillColor: [24, 24, 27], textColor: [234, 179, 8] },
    body: rows,
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, fillColor: [244, 244, 245] }
    },
    styles: { fontSize: 10, cellPadding: 3 }
  });

  const endY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'Thank you for choosing us. Keep this receipt for tracking and pickup.',
    margin,
    endY + 12
  );

  // Company signature
  const sigY = Math.max(endY + 26, pageH - 34);
  doc.setDrawColor(180, 180, 185);
  doc.line(pageW - margin - 72, sigY, pageW - margin, sigY);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(40, 40, 45);
  doc.text(company, pageW - margin - 4, sigY - 3, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 115);
  doc.text('Authorized Signature', pageW - margin, sigY + 5, { align: 'right' });

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
    `Route: ${shipment.origin} → ${shipment.destination}\n` +
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
