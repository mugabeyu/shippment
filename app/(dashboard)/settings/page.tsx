'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSettings, useAppConfig, type Settings as SettingsType, type Route } from '@/lib/swr';
import { genId } from '@/lib/store';
import { Building2, Map, CreditCard, Save, Plus, Trash2, X } from 'lucide-react';

export default function Settings() {
  const { settings, loading, error, updateSettings } = useSettings();
  const { config } = useAppConfig();
  const defaults = useMemo(() => config?.defaults || {}, [config]);
  const [draft, setDraft] = useState<SettingsType>({
    companyName: '',
    contactEmail: '',
    phone: '',
    address: '',
    currency: defaults.currency || 'MGA',
    defaultRatePerKg: defaults.defaultRatePerKg || 15000,
    routes: defaults.routes || [],
    paymentMethods: defaults.paymentMethods || []
  });
  const [saved, setSaved] = useState(false);
  const [newRoute, setNewRoute] = useState({ from: '', to: '' });
  const [newMethod, setNewMethod] = useState('');

  useEffect(() => {
    if (settings) {
      setDraft({
        companyName: settings.companyName || '',
        contactEmail: settings.contactEmail || '',
        phone: settings.phone || '',
        address: settings.address || '',
        currency: settings.currency || defaults.currency || 'MGA',
        defaultRatePerKg: settings.defaultRatePerKg || defaults.defaultRatePerKg || 15000,
        routes: settings.routes || [],
        paymentMethods: settings.paymentMethods || []
      });
    }
  }, [settings, defaults]);

  const set = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) =>
    setDraft((d: SettingsType) => ({ ...d, [key]: value }));

  const handleSave = async () => {
    await updateSettings({
      companyName: draft.companyName,
      contactEmail: draft.contactEmail,
      phone: draft.phone,
      address: draft.address,
      currency: draft.currency,
      defaultRatePerKg: draft.defaultRatePerKg,
      paymentMethods: draft.paymentMethods,
      routes: draft.routes
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const addRoute = () => {
    if (!newRoute.from.trim() || !newRoute.to.trim()) return;
    const route: Route = { id: genId(), from: newRoute.from, to: newRoute.to, active: true };
    set('routes', [...draft.routes, route]);
    setNewRoute({ from: '', to: '' });
  };

  const removeRoute = (id: string) => {
    set('routes', draft.routes.filter((r: Route) => r.id !== id));
  };

  const addMethod = () => {
    if (!newMethod.trim()) return;
    set('paymentMethods', [...draft.paymentMethods, newMethod.trim()]);
    setNewMethod('');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg p-4">
          Failed to load settings: {error}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold text-navy-900">Settings</h1>
        <button onClick={handleSave} className="btn-primary">
          <Save className="w-5 h-5 mr-2" />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <section className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center bg-slate-50">
          <Building2 className="w-5 h-5 text-slate-500 mr-3" />
          <h2 className="text-base font-semibold text-navy-900">Company Information</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Company Name">
            <input type="text" value={draft.companyName} onChange={(e) => set('companyName', e.target.value)} className="input-field" />
          </Field>
          <Field label="Contact Email">
            <input type="email" value={draft.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} className="input-field" />
          </Field>
          <Field label="Phone">
            <input type="tel" value={draft.phone} onChange={(e) => set('phone', e.target.value)} className="input-field" />
          </Field>
          <Field label="Currency Code">
            <input type="text" value={draft.currency} onChange={(e) => set('currency', e.target.value)} className="input-field" />
          </Field>
          <Field label="Default Rate (per kg)">
            <input type="number" min="0" value={draft.defaultRatePerKg || ''} onChange={(e) => set('defaultRatePerKg', Number(e.target.value))} className="input-field" />
          </Field>
          <Field label="Headquarters Address" full>
            <textarea rows={2} value={draft.address} onChange={(e) => set('address', e.target.value)} className="input-field resize-none" />
          </Field>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center bg-slate-50">
          <Map className="w-5 h-5 text-slate-500 mr-3" />
          <h2 className="text-base font-semibold text-navy-900">Routes</h2>
        </div>
        <div className="p-5 space-y-3">
          {draft.routes.map((route: Route) => (
            <div key={route.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="font-medium text-navy-900">{route.from}</span>
                <span className="text-amber-500">&#8646;</span>
                <span className="font-medium text-navy-900">{route.to}</span>
              </div>
              <button onClick={() => removeRoute(route.id)} aria-label="Remove route" className="p-1.5 text-slate-500 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <input type="text" placeholder="From" value={newRoute.from} onChange={(e) => setNewRoute({ ...newRoute, from: e.target.value })} className="input-field" />
            <input type="text" placeholder="To" value={newRoute.to} onChange={(e) => setNewRoute({ ...newRoute, to: e.target.value })} className="input-field" />
            <button onClick={addRoute} className="flex items-center justify-center px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" /> Add Route
            </button>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center bg-slate-50">
          <CreditCard className="w-5 h-5 text-slate-500 mr-3" />
          <h2 className="text-base font-semibold text-navy-900">Payment Methods</h2>
        </div>
        <div className="p-5 space-y-3">
          {draft.paymentMethods.map((method: string) => (
            <div key={method} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-700">{method}</span>
              <button onClick={() => set('paymentMethods', draft.paymentMethods.filter((m: string) => m !== method))} aria-label={`Remove ${method}`} className="p-1.5 text-slate-500 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <input type="text" placeholder="e.g. Card, PayPal" value={newMethod} onChange={(e) => setNewMethod(e.target.value)} className="input-field" />
            <button onClick={addMethod} className="flex items-center justify-center px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" /> Add
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-2 ${full ? 'md:col-span-2' : ''}`}>
      <label className="text-xs font-medium uppercase tracking-wider text-slate-600">{label}</label>
      {children}
    </div>
  );
}

