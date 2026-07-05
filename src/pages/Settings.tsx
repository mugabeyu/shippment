import React, { useState } from 'react';
import { useStore, genId, type Settings as SettingsType } from '../store';
import { Building2, Map, CreditCard, Save, Plus, Trash2, X } from 'lucide-react';
export function Settings() {
  const { settings, updateSettings } = useStore();
  const [draft, setDraft] = useState<SettingsType>(settings);
  const [saved, setSaved] = useState(false);
  const [newRoute, setNewRoute] = useState({
    from: '',
    to: ''
  });
  const [newMethod, setNewMethod] = useState('');
  const set = <K extends keyof SettingsType,>(key: K, value: SettingsType[K]) =>
  setDraft((d) => ({
    ...d,
    [key]: value
  }));
  const handleSave = () => {
    updateSettings(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };
  const addRoute = () => {
    if (!newRoute.from.trim() || !newRoute.to.trim()) return;
    set('routes', [
    ...draft.routes,
    {
      id: genId(),
      from: newRoute.from,
      to: newRoute.to,
      active: true
    }]
    );
    setNewRoute({
      from: '',
      to: ''
    });
  };
  const addMethod = () => {
    if (!newMethod.trim()) return;
    set('paymentMethods', [...draft.paymentMethods, newMethod.trim()]);
    setNewMethod('');
  };
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <button
          onClick={handleSave}
          className="flex items-center px-4 py-2 bg-yellow-500 text-zinc-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors">
          
          <Save className="w-5 h-5 mr-2" />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Company Info */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center bg-zinc-950/50">
          <Building2 className="w-5 h-5 text-zinc-400 mr-3" />
          <h2 className="text-lg font-semibold text-white">
            Company Information
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Company Name">
            <input
              type="text"
              value={draft.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              className={inputCls} />
            
          </Field>
          <Field label="Contact Email">
            <input
              type="email"
              value={draft.contactEmail}
              onChange={(e) => set('contactEmail', e.target.value)}
              className={inputCls} />
            
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              value={draft.phone}
              onChange={(e) => set('phone', e.target.value)}
              className={inputCls} />
            
          </Field>
          <Field label="Currency Code">
            <input
              type="text"
              value={draft.currency}
              onChange={(e) => set('currency', e.target.value)}
              className={inputCls} />
            
          </Field>
          <Field label="Default Rate (per kg)">
            <input
              type="number"
              min="0"
              value={draft.defaultRatePerKg || ''}
              onChange={(e) => set('defaultRatePerKg', Number(e.target.value))}
              className={inputCls} />
            
          </Field>
          <Field label="Headquarters Address" full>
            <textarea
              rows={2}
              value={draft.address}
              onChange={(e) => set('address', e.target.value)}
              className={`${inputCls} resize-none`} />
            
          </Field>
        </div>
      </section>

      {/* Routes */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center bg-zinc-950/50">
          <Map className="w-5 h-5 text-zinc-400 mr-3" />
          <h2 className="text-lg font-semibold text-white">Routes</h2>
        </div>
        <div className="p-6 space-y-3">
          {draft.routes.map((route) =>
          <div
            key={route.id}
            className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
            
              <div className="flex items-center space-x-4">
                <span className="font-medium text-white">{route.from}</span>
                <span className="text-yellow-500">&#8646;</span>
                <span className="font-medium text-white">{route.to}</span>
              </div>
              <button
              onClick={() =>
              set(
                'routes',
                draft.routes.filter((r) => r.id !== route.id)
              )
              }
              aria-label="Remove route"
              className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors">
              
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="text"
              placeholder="From"
              value={newRoute.from}
              onChange={(e) =>
              setNewRoute({
                ...newRoute,
                from: e.target.value
              })
              }
              className={inputCls} />
            
            <input
              type="text"
              placeholder="To"
              value={newRoute.to}
              onChange={(e) =>
              setNewRoute({
                ...newRoute,
                to: e.target.value
              })
              }
              className={inputCls} />
            
            <button
              onClick={addRoute}
              className="flex items-center justify-center px-4 py-2 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap">
              
              <Plus className="w-4 h-4 mr-2" /> Add Route
            </button>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center bg-zinc-950/50">
          <CreditCard className="w-5 h-5 text-zinc-400 mr-3" />
          <h2 className="text-lg font-semibold text-white">Payment Methods</h2>
        </div>
        <div className="p-6 space-y-3">
          {draft.paymentMethods.map((method) =>
          <div
            key={method}
            className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
            
              <span className="text-zinc-300">{method}</span>
              <button
              onClick={() =>
              set(
                'paymentMethods',
                draft.paymentMethods.filter((m) => m !== method)
              )
              }
              aria-label={`Remove ${method}`}
              className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors">
              
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <input
              type="text"
              placeholder="e.g. Card, PayPal"
              value={newMethod}
              onChange={(e) => setNewMethod(e.target.value)}
              className={inputCls} />
            
            <button
              onClick={addMethod}
              className="flex items-center justify-center px-4 py-2 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap">
              
              <Plus className="w-4 h-4 mr-2" /> Add
            </button>
          </div>
        </div>
      </section>
    </div>);

}
const inputCls =
'w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500';
function Field({
  label,
  full,
  children




}: {label: string;full?: boolean;children: React.ReactNode;}) {
  return (
    <div className={`space-y-2 ${full ? 'md:col-span-2' : ''}`}>
      <label className="text-sm font-medium text-zinc-400">{label}</label>
      {children}
    </div>);

}