'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSettings, useAppConfig, type Settings as SettingsType } from '@/lib/swr';
import { Building2, CreditCard, Save, Plus, X } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useToast } from '@/lib/toast';

export default function Settings() {
  const t = useT();
  const { toast } = useToast();
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
    paymentMethods: defaults.paymentMethods || []
  });
  const [saved, setSaved] = useState(false);
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
        paymentMethods: settings.paymentMethods || []
      });
    }
  }, [settings, defaults]);

  const set = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) =>
    setDraft((d: SettingsType) => ({ ...d, [key]: value }));

  const handleSave = async () => {
    try {
      await updateSettings({
        companyName: draft.companyName,
        contactEmail: draft.contactEmail,
        phone: draft.phone,
        address: draft.address,
        currency: draft.currency,
        defaultRatePerKg: draft.defaultRatePerKg,
        paymentMethods: draft.paymentMethods
      });
      setSaved(true);
      toast('success', 'Settings saved');
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      toast('error', err?.message || 'Failed to save settings');
    }
  };

  const addMethod = () => {
    if (!newMethod.trim()) return;
    set('paymentMethods', [...draft.paymentMethods, newMethod.trim()]);
    setNewMethod('');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-white/40">Loading settings...</div>;
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg p-4">
          Failed to load settings: {error}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold text-white/90">{t('Settings')}</h1>
      </div>

      <section className="card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center bg-[#1A1C24]">
          <Building2 className="w-5 h-5 text-white/40 mr-3" />
          <h2 className="text-base font-semibold text-white/90">{t('Company Information')}</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label={t('Company Name')}>
            <input type="text" value={draft.companyName} onChange={(e) => set('companyName', e.target.value)} className="input-field" />
          </Field>
          <Field label={t('Contact Email')}>
            <input type="email" value={draft.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} className="input-field" />
          </Field>
          <Field label={t('Phone')}>
            <input type="tel" value={draft.phone} onChange={(e) => set('phone', e.target.value)} className="input-field" />
          </Field>
          <Field label={t('Currency Code')}>
            <input type="text" value={draft.currency} onChange={(e) => set('currency', e.target.value)} className="input-field" />
          </Field>
          <Field label={t('Default Rate (per kg)')}>
            <input type="number" min="0" value={draft.defaultRatePerKg || ''} onChange={(e) => set('defaultRatePerKg', Number(e.target.value))} className="input-field" />
          </Field>
          <Field label={t('Headquarters Address')} full>
            <textarea rows={2} value={draft.address} onChange={(e) => set('address', e.target.value)} className="input-field resize-none" />
          </Field>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center bg-[#1A1C24]">
          <CreditCard className="w-5 h-5 text-white/40 mr-3" />
          <h2 className="text-base font-semibold text-white/90">{t('Payment Methods')}</h2>
        </div>
        <div className="p-5 space-y-3">
          {draft.paymentMethods.map((method: string) => (
            <div key={method} className="flex items-center justify-between p-3 bg-[#1A1C24] border border-white/[0.06] rounded-lg">
              <span className="text-white/80">{method}</span>
              <button onClick={() => set('paymentMethods', draft.paymentMethods.filter((m: string) => m !== method))} aria-label={`Remove ${method}`} className="p-1.5 text-white/40 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <input type="text" placeholder={t('e.g. Cash, Bank Transfer')} value={newMethod} onChange={(e) => setNewMethod(e.target.value)} className="input-field" />
            <button onClick={addMethod} className="btn-primary whitespace-nowrap">
              <Plus className="w-4 h-4" /> {t('Add')}
            </button>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
          <button onClick={handleSave} className="btn-primary">
            <Save className="w-5 h-5 mr-2" />
            {saved ? t('Saved!') : t('Save Changes')}
          </button>
      </div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-2 ${full ? 'md:col-span-2' : ''}`}>
      <label className="text-sm font-medium uppercase tracking-wider text-white/60">{label}</label>
      {children}
    </div>
  );
}
