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
customer: Customer | undefined,
settings: Settings)
{
  const cost = shipment.weightKg * settings.defaultRatePerKg;
  return {
    cost,
    fmtCost: `${cost.toLocaleString()} ${settings.currency}`
  };
}

/** Generate and download a branded PDF receipt for a shipment. */
export function generateReceiptPDF(
shipment: Shipment,
customer: Customer | undefined,
settings: Settings)
{
  const doc = new jsPDF();
  const { fmtCost } = receiptLines(shipment, customer, settings);

  // Header band
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(234, 179, 8);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.companyName.toUpperCase(), 14, 16);
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.address, 14, 23);
  doc.text(`${settings.phone}  |  ${settings.contactEmail}`, 14, 28);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SHIPMENT RECEIPT', 14, 48);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tracking No: ${shipment.trackingNumber}`, 14, 56);
  doc.text(`Date: ${shipment.date}`, 150, 56);

  autoTable(doc, {
    startY: 64,
    theme: 'grid',
    headStyles: { fillColor: [24, 24, 27], textColor: [234, 179, 8] },
    body: [
    ['Customer', customer?.name ?? 'Unknown'],
    ['Phone (Loyalty ID)', customer?.phone ?? '-'],
    ['Route', `${shipment.origin} \u2192 ${shipment.destination}`],
    ['Category', shipment.category],
    ['Description', shipment.description],
    ['Weight', `${shipment.weightKg} kg`],
    ['Quantity', `${shipment.quantity} item(s)`],
    ['Status', shipment.status],
    ['Payment', `${shipment.paymentStatus} (${shipment.paymentMethod})`],
    ['Total', fmtCost]],

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
  const cost = shipment.weightKg * settings.defaultRatePerKg;
  return (
    `*${settings.companyName.toUpperCase()} - RECEIPT*\n\n` +
    `Tracking: ${shipment.trackingNumber}\n` +
    `Date: ${shipment.date}\n` +
    `Route: ${shipment.origin} \u2192 ${shipment.destination}\n` +
    `Goods: ${shipment.category} (${shipment.description})\n` +
    `Weight: ${shipment.weightKg} kg\n` +
    `Quantity: ${shipment.quantity}\n` +
    `Status: ${shipment.status}\n` +
    `Payment: ${shipment.paymentStatus} - ${shipment.paymentMethod}\n` +
    `Total: ${cost.toLocaleString()} ${settings.currency}\n\n` +
    `Thank you for choosing ${settings.companyName}!`);

}