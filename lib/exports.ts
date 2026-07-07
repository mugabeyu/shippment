import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Shipment, Settings } from './store';

/** Trigger a client-side download of CSV text. */
export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? '');
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(',')
    )
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Capture the receipt DOM element as a high-resolution canvas. */
async function captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    backgroundColor: '#12141C',
    scale: 3,
    logging: false,
    allowTaint: true,
    useCORS: true
  });
}

/** Embed a captured canvas into an A4 jsPDF with proper margins and alignment. */
function canvasToPDF(canvas: HTMLCanvasElement): jsPDF {
  const imgData = canvas.toDataURL('image/png');
  const imgW = canvas.width;
  const imgH = canvas.height;

  // A4 dimensions in mm
  const pageW = 210;
  const pageH = 297;
  const margin = 8; // 8mm margin on each side

  // Available area for the receipt image
  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2;

  // Scale image to fit within available width, maintaining aspect ratio
  const ratio = Math.min(availW / imgW, 1);
  const renderW = imgW * ratio;
  const renderH = imgH * ratio;

  // Center the image horizontally
  const x = margin + (availW - renderW) / 2;

  const doc = new jsPDF('p', 'mm', 'a4');

  // If content fits on one page
  if (renderH <= availH) {
    const y = margin + (availH - renderH) / 2;
    doc.addImage(imgData, 'PNG', x, y, renderW, renderH);
  } else {
    // Multi-page: slice the image vertically
    let srcY = 0;
    let page = 0;
    while (srcY < imgH) {
      if (page > 0) doc.addPage();
      const sliceH = Math.min(imgH - srcY, Math.round(availH / ratio));
      const renderSliceH = sliceH * ratio;

      // Create a temp canvas for this slice
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = imgW;
      sliceCanvas.height = sliceH;
      const ctx = sliceCanvas.getContext('2d')!;
      ctx.drawImage(canvas, 0, srcY, imgW, sliceH, 0, 0, imgW, sliceH);

      const sliceData = sliceCanvas.toDataURL('image/png');
      doc.addImage(sliceData, 'PNG', x, margin, renderW, renderSliceH);

      srcY += sliceH;
      page++;
    }
  }

  return doc;
}

/** Capture the receipt DOM element and trigger a PDF download. */
export async function generateReceiptPDF(element: HTMLElement, trackingNumber: string) {
  const canvas = await captureElement(element);
  const doc = canvasToPDF(canvas);
  doc.save(`Receipt-${trackingNumber}.pdf`);
}

/** Capture the receipt DOM element and return a Blob for sharing. */
export async function generateReceiptBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await captureElement(element);
  const doc = canvasToPDF(canvas);
  return doc.output('blob');
}

/** WhatsApp receipt text message. */
export function whatsappReceiptText(
  shipment: Shipment,
  settings: Settings
): string {
  const cost =
    shipment.finalAmount ??
    shipment.basePrice ??
    shipment.weightKg * settings.defaultRatePerKg;
  const baseCost =
    shipment.basePrice ?? shipment.weightKg * settings.defaultRatePerKg;
  const discount = shipment.discountAmount ?? 0;

  let text =
    `*${settings.companyName.toUpperCase()} - RECEIPT*\n` +
    `Phone: ${settings.phone}\n` +
    `Email: ${settings.contactEmail}\n\n` +
    `Tracking: ${shipment.trackingNumber}\n` +
    `Date: ${shipment.date}\n` +
    `Route: ${shipment.origin} → ${shipment.destination}\n` +
    `Category: ${shipment.category}\n` +
    `Description: ${shipment.description}\n` +
    `Weight: ${shipment.weightKg} kg\n` +
    `Quantity: ${shipment.quantity} items\n` +
    `Method: ${shipment.paymentMethod}\n` +
    `Status: ${shipment.paymentStatus}\n\n` +
    `Subtotal: ${baseCost.toLocaleString()} ${settings.currency}\n`;

  if (discount > 0) {
    text += `Discount: - ${discount.toLocaleString()} ${settings.currency}\n`;
  } else {
    text += `Discount: 0 ${settings.currency}\n`;
  }
  text += `*TOTAL: ${cost.toLocaleString()} ${settings.currency}*\n\n`;
  text += `Thank you for choosing ${settings.companyName}!`;

  return text;
}
