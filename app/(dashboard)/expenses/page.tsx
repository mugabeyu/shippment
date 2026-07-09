'use client';

import React, { useState } from 'react';
import { useExpenses, useAppConfig, useSettings } from '@/lib/swr';
import { useToast } from '@/lib/toast';
import { useT } from '@/lib/i18n';
import { Plus, Search, X, Trash2, Edit2, DollarSign, Camera, Paperclip } from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'Air Tickets', 'Customs', 'Freight', 'Packaging', 'Fuel', 'Maintenance',
  'Office Supplies', 'Utilities', 'Rent', 'Insurance', 'Marketing', 'Salaries',
  'Taxes', 'Legal', 'Software', 'Other'
];

export default function Expenses() {
  const t = useT();
  const { expenses, loading, error, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { toast } = useToast();
  const { config } = useAppConfig();
  const { settings } = useSettings();
  const currency = settings?.currency || config?.defaults?.currency || 'MGA';
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: 0,
    note: '',
    attachmentUrl: ''
  });

  const filtered = expenses.filter((e) => {
    const term = searchTerm.toLowerCase();
    return e.category.toLowerCase().includes(term) || e.note.toLowerCase().includes(term);
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const openNew = () => {
    setDraft({ id: '', date: new Date().toISOString().split('T')[0], category: '', amount: 0, note: '', attachmentUrl: '' });
    setIsModalOpen(true);
  };

  const openEdit = (expense: any) => {
    setDraft({
      id: expense.id,
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      note: expense.note || '',
      attachmentUrl: expense.attachmentUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        date: draft.date,
        category: draft.category,
        amount: draft.amount,
        note: draft.note,
        attachmentUrl: draft.attachmentUrl || null
      };
      if (draft.id) {
        await updateExpense(draft.id, payload);
        toast('success', 'Expense updated successfully');
      } else {
        await addExpense(payload);
        toast('success', 'Expense added successfully');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast('error', err?.message || 'Failed to save expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this expense?')) {
      try {
        await deleteExpense(id);
        toast('success', 'Expense deleted');
      } catch (err: any) {
        toast('error', err?.message || 'Failed to delete expense');
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-white/40 animate-pulse">Loading expenses...</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-400 rounded-xl p-4">{error}</div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white/90">{t('Expenses')}</h1>
          <p className="text-sm text-white/40">{t('Track all business costs')}</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          {t('Add Expense')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 cinematic-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium uppercase tracking-wider text-white/40">{t('Total Expenses')}</span>
            <DollarSign className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-400">{totalExpenses.toLocaleString()} {currency}</div>
          <div className="text-sm text-white/25 mt-1">{expenses.length} {t('entries')}</div>
        </div>
        <div className="card p-5 cinematic-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium uppercase tracking-wider text-white/40">{t('This Month')}</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {expenses.filter((e) => {
              const now = new Date();
              return e.date && new Date(e.date).getMonth() === now.getMonth() && new Date(e.date).getFullYear() === now.getFullYear();
            }).reduce((sum, e) => sum + e.amount, 0).toLocaleString()} {currency}
          </div>
          <div className="text-sm text-white/25 mt-1">{t('Current month')}</div>
        </div>
        <div className="card p-5 cinematic-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium uppercase tracking-wider text-white/40">{t('Categories')}</span>
            <Paperclip className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-primary">
            {new Set(expenses.map((e) => e.category)).size}
          </div>
          <div className="text-sm text-white/25 mt-1">{t('Unique categories')}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/25" />
            <input
              type="text"
              placeholder={t('Search expenses...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-sm text-white/40 uppercase bg-[#1A1C24] border-b border-white/[0.06]">
              <tr>
                <th className="px-6 py-4 font-medium">{t('Date')}</th>
                <th className="px-6 py-4 font-medium">{t('Category')}</th>
                <th className="px-6 py-4 font-medium">{t('Amount')}</th>
                <th className="px-6 py-4 font-medium">{t('Note')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filtered.map((expense) => (
                <tr key={expense.id} className="hover:bg-[#1A1C24] transition-all duration-200">
                  <td className="px-6 py-4 font-mono text-sm text-white/40">{expense.date}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-[#1E1E2E] border border-white/[0.06] rounded-lg text-sm font-medium text-white/70">{t(expense.category)}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-red-400">
                    - {expense.amount.toLocaleString()} {currency}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-white/60">{expense.note || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(expense)} className="p-2 text-white/50 hover:text-cyan-400 hover:bg-white/[0.04] transition-all duration-200 hover:scale-110 rounded-lg" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(expense.id)} className="p-2 text-white/25 hover:text-red-500 transition-all duration-200 hover:scale-110 rounded-lg hover:bg-[#1E1E2E]" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-white/40">{t('No expenses found.')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-[#12141C] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-white/[0.06] shrink-0">
              <h2 className="text-lg font-semibold text-white/90">{draft.id ? t('Edit Expense') : t('Add Expense')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white/90 transition-colors hover:rotate-90 duration-200 p-1.5 rounded-xl hover:bg-white/[0.04]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium uppercase tracking-wider text-white/40 mb-1.5">{t('Date')}</label>
                  <input required type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium uppercase tracking-wider text-white/40 mb-1.5">{t('Category')}</label>
                  <select required value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="input-field">
                    <option value="">{t('Select...')}</option>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                  <label className="block text-sm font-medium uppercase tracking-wider text-white/40 mb-1.5">{t('Amount')} ({currency})</label>
                <input required type="number" min="1" value={draft.amount || ''} onChange={(e) => setDraft({ ...draft, amount: Math.max(1, parseInt(e.target.value) || 0) })} className="input-field" />
              </div>
              <div>
                  <label className="block text-sm font-medium uppercase tracking-wider text-white/40 mb-1.5">{t('Note')}</label>
                  <textarea rows={3} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder={t('Add a description...')} className="input-field resize-none" />
              </div>
              <div>
                  <label className="block text-sm font-medium uppercase tracking-wider text-white/40 mb-1.5">{t('Attachment URL')}</label>
                  <input type="text" value={draft.attachmentUrl} onChange={(e) => setDraft({ ...draft, attachmentUrl: e.target.value })} placeholder="https://..." className="input-field" />
                </div>
                <div className="pt-4 flex justify-end space-x-3 border-t border-white/[0.06]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-white/40 hover:text-white/90 transition-colors rounded-xl">{t('Cancel')}</button>
                  <button type="submit" className="btn-primary">{draft.id ? t('Save Changes') : t('Add Expense')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
