import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShipments, useCustomers, useSettings, useNotifications, useAppConfig } from '../hooks/useData';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  FileText,
  MessageCircle,
  Truck,
  CheckCircle,
  XCircle,
  ClipboardList,
  Mail
} from 'lucide-react';
import { generateReceiptPDF, whatsappReceiptText } from '../lib/exports';

const ICON_MAP: Record<string, React.ComponentType<{className?: string}>> = {
  Package, ClipboardList, Truck, MapPin, CheckCircle, XCircle
};

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ComponentType<{className?: string}>;
}

export function ShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shipments, loading: shipmentsLoading, updateShipmentStatus } = useShipments();
  const { customers } = useCustomers();
  const { settings, loading: settingsLoading } = useSettings();
  const { createNotification } = useNotifications();
  const { config } = useAppConfig();
  const timelineSteps: TimelineStep[] = (config?.timeline_steps || []).map((step: any) => ({
    ...step,
    icon: ICON_MAP[step.icon] || Package
  }));

  const shipment = shipments.find((s) => s.id === id);
  const customer = shipment ? customers.find((c) => c.id === shipment.customerId) : undefined;
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState('');

  const isLoading = shipmentsLoading || settingsLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Loading shipment details...</div>;
  }

  if (!shipment) {
    return (
      <div className="space-y-5">
        <button onClick={() => navigate('/shipments')} className="flex items-center text-primary hover:text-primary-700 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Shipments
        </button>
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">Shipment not found.</div>
      </div>
    );
  }

  const statusIdx = timelineSteps.findIndex((s) => s.key === shipment.status);
  const cost = shipment.weightKg * (settings?.defaultRatePerKg || 0);
  const fmtCost = `${cost.toLocaleString()} ${settings?.currency || 'MGA'}`;

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
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePDF = () => {
    if (!customer || !settings) return;
    generateReceiptPDF(shipment, customer, settings);
  };

  const handleWhatsApp = () => {
    if (!customer || !settings) return;
    const text = whatsappReceiptText(shipment, settings);
    const url = `https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/shipments')} className="flex items-center text-primary hover:text-primary-700 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Shipments
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy-900">{shipment.trackingNumber}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Shipment details and status tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handlePDF} className="flex items-center px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-700 transition-colors">
            <FileText className="w-4 h-4 mr-2" /> PDF Receipt
          </button>
          <button onClick={handleWhatsApp} className="flex items-center px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-navy-900 mb-4">Shipment Timeline</h3>
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -translate-y-1/2"></div>
              {timelineSteps.map((step, idx) => {
                const Icon = step.icon;
                const completed = idx <= statusIdx;
                const current = idx === statusIdx;
                return (
                  <div key={step.key} className="relative flex flex-col items-center z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${current ? 'bg-primary text-white ring-4 ring-primary/20' : completed ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-xs mt-2 font-medium ${current ? 'text-primary' : completed ? 'text-navy-900' : 'text-slate-400'}`}>{step.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Update Status</label>
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

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-navy-900 mb-4">Shipment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Origin</label>
                <div className="flex items-center gap-2 text-sm text-navy-900 bg-slate-50 p-3 rounded-lg">
                  <MapPin className="w-4 h-4 text-slate-400" /> {shipment.origin}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Destination</label>
                <div className="flex items-center gap-2 text-sm text-navy-900 bg-slate-50 p-3 rounded-lg">
                  <MapPin className="w-4 h-4 text-slate-400" /> {shipment.destination}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Category</label>
                <div className="flex items-center gap-2 text-sm text-navy-900 bg-slate-50 p-3 rounded-lg">
                  <Package className="w-4 h-4 text-slate-400" /> {shipment.category}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Weight</label>
                <div className="flex items-center gap-2 text-sm text-navy-900 bg-slate-50 p-3 rounded-lg">
                  <DollarSign className="w-4 h-4 text-slate-400" /> {shipment.weightKg} kg
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Quantity</label>
                <div className="flex items-center gap-2 text-sm text-navy-900 bg-slate-50 p-3 rounded-lg">
                  <Package className="w-4 h-4 text-slate-400" /> {shipment.quantity} items
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Date</label>
                <div className="flex items-center gap-2 text-sm text-navy-900 bg-slate-50 p-3 rounded-lg">
                  <Calendar className="w-4 h-4 text-slate-400" /> {shipment.date}
                </div>
              </div>
              {shipment.description && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Description</label>
                  <p className="text-sm text-navy-900 bg-slate-50 p-3 rounded-lg">{shipment.description}</p>
                </div>
              )}
              {shipment.specialInstructions && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Special Instructions</label>
                  <p className="text-sm text-navy-900 bg-slate-50 p-3 rounded-lg">{shipment.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-navy-900 mb-4">Customer</h3>
            {customer && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                    {customer.photo ? (
                      <img src={customer.photo} alt={customer.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-sm font-bold text-navy-700">{customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-navy-900">{customer.name}</div>
                    <div className="text-xs text-slate-500">{customer.phone}</div>
                  </div>
                </div>
                {customer.address && (
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <span>{customer.address}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{customer.email}</span>
                  </div>
                )}
                <button onClick={() => navigate(`/customers/${customer.id}`)} className="w-full mt-2 px-4 py-2 text-sm font-medium text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors">
                  View Full Profile
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-navy-900 mb-4">Payment</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Weight</span>
                <span className="font-medium text-navy-900">{shipment.weightKg} kg</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Rate</span>
                <span className="font-medium text-navy-900">{settings?.defaultRatePerKg?.toLocaleString()} {settings?.currency}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Method</span>
                <span className="font-medium text-navy-900">{shipment.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-200">
                <span className="text-slate-600">Total</span>
                <span className="font-bold text-navy-900 text-lg">{fmtCost}</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${shipment.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {shipment.paymentStatus}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-navy-900 mb-4">Internal Notes</h3>
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  className="input-field resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => { setIsEditing(false); setEditNotes(''); }} className="px-3 py-2 text-sm text-slate-600 hover:text-navy-900">Cancel</button>
                  <button onClick={() => { setIsEditing(false); setEditNotes(''); }} className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-700">Save</button>
                </div>
              </div>
            ) : (
              <div onClick={() => { setEditNotes(shipment.internalNotes || ''); setIsEditing(true); }} className="cursor-pointer">
                <p className="text-sm text-slate-600">{shipment.internalNotes || 'No notes yet. Click to add.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
