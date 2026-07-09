'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomers, type Customer } from '@/lib/swr';
import { Plus, Search, Phone, Mail, MapPin, X, Edit2 } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function Customers() {
  const router = useRouter();
  const t = useT();
  const { customers, loading, error, addCustomer, updateCustomer } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<Customer>({
    id: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    totalKgSent: 0,
    photo: '',
    active: true
  });

  const openNew = () => {
    setDraft({ id: '', name: '', phone: '', email: '', address: '', notes: '', totalKgSent: 0, photo: '', active: true });
    setIsModalOpen(true);
  };
  const openEdit = (customer: Customer) => {
    setDraft(customer);
    setIsModalOpen(true);
  };
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.id) {
      await updateCustomer(draft.id, draft);
    } else {
      const { active, ...createData } = draft;
      await addCustomer({ ...createData, totalKgSent: 0, photo: '' });
    }
    setIsModalOpen(false);
  };
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-white/40">Loading customers...</div>;
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg p-4">
          Failed to load customers: {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-lg font-semibold text-white/90">{t('Customers')}</h1>
        <button
          onClick={openNew}
          className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          {t('Add Customer')}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/25" />
            <input
              type="text"
              placeholder={t('Search by name or phone...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredCustomers.map((customer) =>
            <div
              key={customer.id}
              onClick={() => router.push(`/customer/${customer.id}`)}
              className="card p-5 hover:border-white/[0.1] cursor-pointer">

                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#12141C]/[0.04] border border-white/[0.06] flex items-center justify-center">
                      <span className="text-sm font-bold text-amber-500">
                        {customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white/90 truncate">{customer.name}</h3>
                      <span className={`px-2 py-0.5 text-sm font-medium rounded-full ${
                        customer.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {customer.active ? t('Active') : t('Blocked')}
                      </span>
                    </div>
                    <div className="text-sm text-amber-500 font-medium mt-1">
                      {t('Loyalty:')} {customer.totalKgSent} {t('kg sent')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(customer); }}
                    aria-label={`${t('Edit')} ${customer.name}`}
                    className="p-1.5 text-white/40 hover:text-white/90 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-white/60">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-3 text-white/25" />
                  {customer.phone}
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-3 text-white/25" />
                  {customer.email || 'No email provided'}
                </div>
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 mr-3 mt-0.5 text-white/25 shrink-0" />
                  <span className="line-clamp-2">{customer.address}</span>
                </div>
              </div>

              {customer.notes &&
                <div className="mt-4 pt-4 border-t border-white/[0.06] text-sm text-white/40">
                  <span className="font-medium text-white/60">{t('Notes:')}</span>{' '}
                  {customer.notes}
                </div>
              }
            </div>
          )}
        </div>

        {filteredCustomers.length === 0 &&
          <div className="p-8 text-center text-white/40">
            {t('No customers found.')}
          </div>
        }
      </div>

      {isModalOpen &&
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/[0.06] rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white/90">
                {draft.id ? t('Edit Customer') : t('Add New Customer')}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white/90 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium uppercase tracking-wider text-white/60 mb-1">{t('Full Name')}</label>
                <input
                  required
                  type="text"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      name: e.target.value
                    })
                  }
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium uppercase tracking-wider text-white/60 mb-1">{t('Phone Number (Loyalty ID)')}</label>
                <input
                  required
                  type="tel"
                  placeholder="+230 547 355 38"
                  value={draft.phone}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      phone: e.target.value
                    })
                  }
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium uppercase tracking-wider text-white/60 mb-1">{t('Email Address')}</label>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) =>
                    setDraft({ ...draft, email: e.target.value })
                  }
                  className="input-field"
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium uppercase tracking-wider text-white/60 mb-1">{t('Address')}</label>
                <textarea
                  rows={2}
                  value={draft.address}
                  onChange={(e) =>
                    setDraft({ ...draft, address: e.target.value })
                  }
                  className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium uppercase tracking-wider text-white/60 mb-1">{t('Notes')}</label>
                <textarea
                  rows={2}
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft({ ...draft, notes: e.target.value })
                  }
                  className="input-field resize-none" />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-white/40 hover:text-white/90 transition-colors">
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary">
                  {draft.id ? t('Save Changes') : t('Save Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  );
}
