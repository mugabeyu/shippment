import React, { useState, useEffect } from 'react';
import { useShipments, useCustomers, useCategories, useSettings, useRoutes, useOffers, useAppConfig, type Shipment, type ShipmentStatus } from '../hooks/useData';
import {
  Plus,
  Search,
  FileText,
  FileDown,
  MessageCircle,
  X,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import {
  downloadCSV,
  generateReceiptPDF,
  whatsappReceiptText } from '../lib/exports';
import { supabase } from '../lib/supabaseClient';

export function Shipments() {
  const { shipments, loading, error, addShipment, updateShipmentStatus } = useShipments();
  const { customers } = useCustomers();
  const { categories } = useCategories();
  const { settings } = useSettings();
  const { routes } = useRoutes();
  const { config } = useAppConfig();
  const { offers } = useOffers();
  const statuses: ShipmentStatus[] = (config?.shipment_statuses || []) as ShipmentStatus[];
  const defaults = config?.defaults || {};

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ShipmentStatus>('All');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [newShipment, setNewShipment] = useState({
    customerId: '',
    origin: defaults.origin || '',
    destination: defaults.destination || '',
    category: '',
    weightKg: 0,
    quantity: 1,
    description: '',
    paymentStatus: 'Unpaid' as 'Paid' | 'Unpaid',
    paymentMethod: settings?.paymentMethods?.[0] || defaults.paymentMethods?.[0] || 'Cash',
    photos: [] as string[]
  });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const activeOffer = offers.find((o) => o.active) ?? offers[0];
  const categoryPricePerKg = categories.find((c) => c.name === newShipment.category)?.pricePerKg ?? null;
  const basePrice = (categoryPricePerKg || settings?.defaultRatePerKg || 0) * (newShipment.weightKg || 0) * (newShipment.quantity || 1);
  const offerDiscount = activeOffer
    ? activeOffer.discountPercent > 0
      ? Math.round(basePrice * (activeOffer.discountPercent / 100))
      : activeOffer.discountAmount > 0
        ? activeOffer.discountAmount
        : 0
    : 0;
  const estimatedTotal = Math.max(0, basePrice - offerDiscount);
  const currency = settings?.currency || defaults.currency || 'MGA';

  useEffect(() => {
    if (settings?.paymentMethods?.length) {
      setNewShipment((prev) => ({ ...prev, paymentMethod: settings.paymentMethods[0] }));
    } else if (defaults.paymentMethods?.length) {
      setNewShipment((prev) => ({ ...prev, paymentMethod: defaults.paymentMethods[0] }));
    }
  }, [settings?.paymentMethods, defaults.paymentMethods]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 3 - newShipment.photos.length;
    if (remaining <= 0) return;

    const toUpload = Array.from(files).slice(0, remaining);
    setUploadingPhotos(true);

    try {
      const uploadedUrls: string[] = [];
      for (const file of toUpload) {
        const fileExt = file.name.split('.').pop();
        const fileName = `shipments/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);
        if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl);
      }

      setNewShipment((prev) => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls].slice(0, 3)
      }));
    } catch (err) {
      console.error('Photo upload failed', err);
    } finally {
      setUploadingPhotos(false);
      if (e.target) e.target.value = '';
    }
  };

  const removePhoto = (url: string) => {
    setNewShipment((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p !== url)
    }));
  };

  const handleAddShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trackingNumber = `TRK-${Math.floor(1000 + Math.random() * 9000)}`;
    await addShipment({
      trackingNumber,
      customerId: newShipment.customerId,
      origin: newShipment.origin,
      destination: newShipment.destination,
      category: newShipment.category,
      weightKg: Math.max(1, newShipment.weightKg || 1),
      quantity: Math.max(1, newShipment.quantity || 1),
      description: newShipment.description,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      paymentStatus: newShipment.paymentStatus,
      paymentMethod: newShipment.paymentMethod,
      receiptSent: false,
      photos: newShipment.photos
    });
    setIsNewModalOpen(false);
    setCustomerSearch('');
    setShowCustomerDropdown(false);
    setNewShipment({
      customerId: '',
      origin: defaults.origin || '',
      destination: defaults.destination || '',
      category: '',
      weightKg: 0,
      quantity: 1,
      description: '',
      paymentStatus: 'Unpaid',
      paymentMethod: settings?.paymentMethods?.[0] || defaults.paymentMethods?.[0] || 'Cash',
      photos: []
    });
  };

  const filteredShipments = shipments.filter((s) => {
    const customer = customers.find((c) => c.id === s.customerId);
    const matchesSearch =
      s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Packed':
        return 'bg-blue-100 text-blue-700';
      case 'In Transit':
        return 'bg-amber-100 text-amber-700';
      case 'Delivered':
        return 'bg-green-100 text-green-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const handleWhatsApp = (shipment: Shipment) => {
    const customer = customers.find((c) => c.id === shipment.customerId);
    if (!customer || !settings) return;
    const text = whatsappReceiptText(shipment, settings);
    const url = `https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePDF = (shipment: Shipment) => {
    const customer = customers.find((c) => c.id === shipment.customerId);
    if (!customer || !settings) return;
    generateReceiptPDF(shipment, customer, settings);
  };

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['Tracking', 'Date', 'Customer', 'Phone', 'Origin', 'Destination', 'Category', 'Weight (kg)', 'Quantity', 'Status', 'Payment', 'Method', 'Photos'],
      ...filteredShipments.map((s) => {
        const c = customers.find((cu) => cu.id === s.customerId);
        return [s.trackingNumber, s.date, c?.name ?? '', c?.phone ?? '', s.origin, s.destination, s.category, s.weightKg, s.quantity, s.status, s.paymentStatus, s.paymentMethod, (s as any).photos?.length ?? 0];
      })
    ];
    downloadCSV('shipments.csv', rows);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Loading shipments...</div>;
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg p-4">
          Failed to load shipments: {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-lg font-semibold text-navy-900">Shipments</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="btn-secondary">
            <FileDown className="w-5 h-5 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            New Shipment
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by tracking number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | ShipmentStatus)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:border-amber-500 transition-colors">
            <option value="All">All Statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Tracking</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Route</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Photos</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredShipments.map((shipment) => {
                const customer = customers.find((c) => c.id === shipment.customerId);
                const photos = (shipment as any).photos || [];
                return (
                  <tr key={shipment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-navy-900">{shipment.trackingNumber}</div>
                      <div className="text-xs text-slate-500">{shipment.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-navy-900">{customer?.name}</div>
                      <div className="text-xs text-slate-500">{customer?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span>{shipment.origin}</span>
                        <span className="text-slate-400">&rarr;</span>
                        <span>{shipment.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{shipment.category}</div>
                      <div className="text-xs text-slate-500">{shipment.weightKg} kg &bull; {shipment.quantity} items</div>
                    </td>
                    <td className="px-6 py-4">
                      {photos.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-xs text-slate-500">{photos.length}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={shipment.status}
                        onChange={(e) => updateShipmentStatus(shipment.id, e.target.value as ShipmentStatus)}
                        aria-label="Update status"
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border-none outline-none cursor-pointer appearance-none ${getStatusColor(shipment.status)}`}>
                        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handlePDF(shipment)}
                          className="p-2 text-slate-500 hover:text-amber-500 transition-colors"
                          title="Download PDF receipt"
                          aria-label="Download PDF receipt">
                          <FileText className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleWhatsApp(shipment)}
                          className="p-2 text-slate-500 hover:text-green-500 transition-colors"
                          title="Send receipt via WhatsApp"
                          aria-label="Send receipt via WhatsApp">
                          <MessageCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredShipments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No shipments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsNewModalOpen(false)}>
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-navy-900">Create New Shipment</h2>
              <button onClick={() => { setIsNewModalOpen(false); }} aria-label="Close" className="text-slate-500 hover:text-navy-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddShipment} className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Customer">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className={modalInput}
                    />
                    {showCustomerDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-auto">
                        {customers
                          .filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch))
                          .map((c) => (
                            <div
                              key={c.id}
                              onMouseDown={() => {
                                setNewShipment({ ...newShipment, customerId: c.id });
                                setCustomerSearch(c.name);
                                setShowCustomerDropdown(false);
                              }}
                              className={`px-3 py-2.5 cursor-pointer text-sm hover:bg-slate-50 ${newShipment.customerId === c.id ? 'bg-primary/10 text-primary font-medium' : 'text-navy-900'}`}
                            >
                              <div>{c.name}</div>
                              <div className="text-xs text-slate-500">{c.phone}</div>
                            </div>
                          ))}
                        {customers.filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)).length === 0 && (
                          <div className="px-3 py-2.5 text-sm text-slate-500">No customers found</div>
                        )}
                      </div>
                    )}
                    <select required value={newShipment.customerId} onChange={(e) => { setNewShipment({ ...newShipment, customerId: e.target.value }); setCustomerSearch(customers.find(c => c.id === e.target.value)?.name || ''); }} className={`${modalInput} mt-2`} style={{ display: 'none' }}>
                      <option value="">Select a customer...</option>
                      {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                    </select>
                  </div>
                </Field>
                <Field label="Category">
                  <select required value={newShipment.category} onChange={(e) => setNewShipment({ ...newShipment, category: e.target.value })} className={modalInput}>
                    <option value="">Select a category...</option>
                    {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Origin">
                  <select required value={newShipment.origin} onChange={(e) => setNewShipment({ ...newShipment, origin: e.target.value })} className={modalInput}>
                    <option value="">Select origin...</option>
                    {routes.map((r) => <option key={`from-${r.from}`} value={r.from}>{r.from}</option>)}
                  </select>
                </Field>
                <Field label="Destination">
                  <select required value={newShipment.destination} onChange={(e) => setNewShipment({ ...newShipment, destination: e.target.value })} className={modalInput}>
                    <option value="">Select destination...</option>
                    {routes.map((r) => <option key={`to-${r.to}`} value={r.to}>{r.to}</option>)}
                  </select>
                </Field>
                <Field label="Weight (KG)">
                  <input required type="number" min="1" step="1" value={newShipment.weightKg || ''} onChange={(e) => setNewShipment({ ...newShipment, weightKg: Math.max(1, parseInt(e.target.value) || 0) })} className={modalInput} />
                </Field>
                <Field label="Quantity (Items)">
                  <input required type="number" min="1" value={newShipment.quantity || ''} onChange={(e) => setNewShipment({ ...newShipment, quantity: Math.max(1, parseInt(e.target.value) || 0) })} className={modalInput} />
                </Field>
                <Field label="Description of Goods" full>
                  <textarea required rows={2} value={newShipment.description} onChange={(e) => setNewShipment({ ...newShipment, description: e.target.value })} className={`${modalInput} resize-none`} />
                </Field>
                <Field label="Goods Photos (up to 3)" full>
                  <div className="space-y-3">
                    <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Camera className="w-5 h-5" />
                        <span>{uploadingPhotos ? 'Uploading...' : 'Click to upload photos (max 3)'}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhotos || newShipment.photos.length >= 3}
                        className="hidden"
                      />
                    </label>
                    {newShipment.photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {newShipment.photos.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img src={url} alt={`Shipment ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                            <button
                              type="button"
                              onClick={() => removePhoto(url)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-500">{newShipment.photos.length} / 3 photos uploaded</p>
                  </div>
                </Field>
                <Field label="Payment Method">
                  <select value={newShipment.paymentMethod} onChange={(e) => setNewShipment({ ...newShipment, paymentMethod: e.target.value })} className={modalInput}>
                    {settings?.paymentMethods?.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Payment Status">
                  <select value={newShipment.paymentStatus} onChange={(e) => setNewShipment({ ...newShipment, paymentStatus: e.target.value as 'Paid' | 'Unpaid' })} className={modalInput}>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </Field>
                <div className="md:col-span-2 bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Price Preview</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Category rate</span>
                      <span>{(categoryPricePerKg || settings?.defaultRatePerKg || 0).toLocaleString()} {currency} / kg</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Weight</span>
                      <span>{newShipment.weightKg || 0} kg &times; {newShipment.quantity || 1} items</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>{basePrice.toLocaleString()} {currency}</span>
                    </div>
                    {offerDiscount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Offer discount</span>
                        <span>- {offerDiscount.toLocaleString()} {currency}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-navy-900 font-bold pt-2 border-t border-slate-200">
                      <span>Estimated total</span>
                      <span>{estimatedTotal.toLocaleString()} {currency}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-200">
                <button type="button" onClick={() => { setIsNewModalOpen(false); }} className="px-4 py-2 text-slate-500 hover:text-navy-900 transition-colors">Cancel</button>
                <button type="submit" className="btn-primary" disabled={uploadingPhotos}>Create Shipment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const modalInput = 'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-navy-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors';

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-2 ${full ? 'md:col-span-2' : ''}`}>
      <label className="text-xs font-medium uppercase tracking-wider text-slate-600">{label}</label>
      {children}
    </div>
  );
}
