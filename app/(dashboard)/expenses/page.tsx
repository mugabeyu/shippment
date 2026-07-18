'use client';

import React, { useState } from 'react';
import { useExpenses, useExpenseCategories, useAppConfig, useSettings } from '@/lib/swr';
import { useUiStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase/client';
import { Plus, Search, X, Trash2, Edit2, DollarSign, Camera, Upload, Tag, Image as ImageIcon, Paperclip } from 'lucide-react';

const MAX_PHOTOS = 3;

export default function Expenses() {
  const t = useT();
  const { expenses, loading, error, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { expenseCategories, loading: categoriesLoading, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory } = useExpenseCategories();
  const { toast } = useToast();
  const { config } = useAppConfig();
  const { settings } = useSettings();
  const { activeStaffRole } = useUiStore();
  const isAdmin = activeStaffRole === 'Admin';
  const currency = settings?.currency || config?.defaults?.currency || 'MGA';

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [draft, setDraft] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: 0,
    note: '',
    photos: [] as string[]
  });

  const [viewingExpense, setViewingExpense] = useState<any>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catDraft, setCatDraft] = useState({ id: '', name: '', description: '' });

  const filtered = expenses.filter((e) => {
    const term = searchTerm.toLowerCase();
    return e.category.toLowerCase().includes(term) || e.note.toLowerCase().includes(term);
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const openNew = () => {
    setDraft({ id: '', date: new Date().toISOString().split('T')[0], category: '', amount: 0, note: '', photos: [] });
    setIsModalOpen(true);
  };

  const openEdit = (expense: any) => {
    setDraft({
      id: expense.id,
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      note: expense.note || '',
      photos: expense.photos || []
    });
    setIsModalOpen(true);
  };

  const openDetail = (expense: any) => setViewingExpense(expense);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        date: draft.date,
        category: draft.category,
        amount: draft.amount,
        note: draft.note,
        photos: draft.photos
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

  // --- Photo upload (same client-direct-to-Supabase-Storage pattern used by Shipments) ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = MAX_PHOTOS - draft.photos.length;
    if (remaining <= 0) return;
    const toUpload = Array.from(files).slice(0, remaining);
    setUploadingPhotos(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of toUpload) {
        const fileExt = file.name.split('.').pop();
        const fileName = `expenses/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('photos').upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);
        if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl);
      }
      setDraft((prev) => ({ ...prev, photos: [...prev.photos, ...uploadedUrls].slice(0, MAX_PHOTOS) }));
    } catch (err: any) {
      toast('error', err?.message || 'Photo upload failed');
    } finally {
      setUploadingPhotos(false);
      if (e.target) e.target.value = '';
    }
  };

  const removePhoto = (url: string) => {
    setDraft((prev) => ({ ...prev, photos: prev.photos.filter((p) => p !== url) }));
  };

  // --- Category management (Admin only) ---
  const openCatManage = () => {
    setCatDraft({ id: '', name: '', description: '' });
    setCatModalOpen(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catDraft.name.trim()) return;
    try {
      if (catDraft.id) {
        await updateExpenseCategory(catDraft.id, { name: catDraft.name.trim(), description: catDraft.description });
        toast('success', 'Category updated');
      } else {
        await addExpenseCategory({ name: catDraft.name.trim(), description: catDraft.description });
        toast('success', 'Category created');
      }
      setCatDraft({ id: '', name: '', description: '' });
    } catch (err: any) {
      toast('error', err?.message || 'Failed to save category');
    }
  };

  const handleCatDelete = async (id: string, name: string) => {
    if (!confirm(`Delete the "${name}" category?`)) return;
    try {
      await deleteExpenseCategory(id);
      toast('success', 'Category deleted');
    } catch (err: any) {
      toast('error', err?.message || 'Failed to delete category');
    }
  };

  // The current draft's category may no longer exist in the managed list
  // (deleted by an admin, or a legacy free-text value) — keep it selectable
  // so editing an expense never silently changes its category.
  const categoryOptions = draft.category && !expenseCategories.some((c: any) => c.name === draft.category)
    ? [...expenseCategories, { id: '__legacy', name: draft.category, description: '' }]
    : expenseCategories;

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
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={openCatManage} className="btn-secondary">
              <Tag className="w-4 h-4 mr-2" />
              {t('Manage Categories')}
            </button>
          )}
          <button onClick={openNew} className="btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            {t('Add Expense')}
          </button>
        </div>
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
          <div className="text-2xl font-bold text-primary">{expenseCategories.length}</div>
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
                <tr key={expense.id} onClick={() => openDetail(expense)} className="hover:bg-[#1A1C24] transition-all duration-200 cursor-pointer">
                  <td className="px-6 py-4 font-mono text-sm text-white/40">{expense.date}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-[#1E1E2E] border border-white/[0.06] rounded-lg text-sm font-medium text-white/70">{t(expense.category)}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-red-400">
                    - {expense.amount.toLocaleString()} {currency}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-white/60">
                    <span className="flex items-center gap-2">
                      {expense.note || '-'}
                      {expense.photos?.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary shrink-0" title={`${expense.photos.length} photo(s)`}>
                          <ImageIcon className="w-3.5 h-3.5" /> {expense.photos.length}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
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

      {/* Add/Edit Expense Modal */}
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
                  <select required value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="input-field" disabled={categoriesLoading}>
                    <option value="">{t('Select...')}</option>
                    {categoryOptions.map((c: any) => <option key={c.id} value={c.name}>{t(c.name)}</option>)}
                  </select>
                  {!categoriesLoading && expenseCategories.length === 0 && (
                    <p className="text-xs text-amber-400 mt-1">{t('No categories yet — ask an administrator to add one.')}</p>
                  )}
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
                <label className="block text-sm font-medium uppercase tracking-wider text-white/40 mb-1.5">{t('Photos (up to 3)')}</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/[0.10] rounded-lg text-sm text-white/60 transition-colors ${draft.photos.length >= MAX_PHOTOS || uploadingPhotos ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}`}>
                      <Upload className="w-4 h-4" />
                      <span>{uploadingPhotos ? t('Uploading...') : t('Upload')}</span>
                      <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} disabled={uploadingPhotos || draft.photos.length >= MAX_PHOTOS} className="hidden" />
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/[0.10] rounded-lg text-sm text-white/60 transition-colors ${draft.photos.length >= MAX_PHOTOS || uploadingPhotos ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}`}>
                      <Camera className="w-4 h-4" />
                      <span>{t('Take Photo')}</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} disabled={uploadingPhotos || draft.photos.length >= MAX_PHOTOS} className="hidden" />
                    </label>
                  </div>
                  {draft.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {draft.photos.map((url) => (
                        <div key={url} className="relative group">
                          <img src={url} alt="Expense" className="w-full h-24 object-cover rounded-lg border border-white/[0.06]" />
                          <button type="button" onClick={() => removePhoto(url)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
                <div className="pt-4 flex justify-end space-x-3 border-t border-white/[0.06]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-white/40 hover:text-white/90 transition-colors rounded-xl">{t('Cancel')}</button>
                  <button type="submit" className="btn-primary">{draft.id ? t('Save Changes') : t('Add Expense')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Detail Modal */}
      {viewingExpense && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setViewingExpense(null)}>
          <div className="bg-[#12141C] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-white/[0.06] shrink-0">
              <h2 className="text-lg font-semibold text-white/90">{t('Expense Details')}</h2>
              <button onClick={() => setViewingExpense(null)} className="text-white/40 hover:text-white/90 transition-colors hover:rotate-90 duration-200 p-1.5 rounded-xl hover:bg-white/[0.04]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium uppercase tracking-wider text-white/40 mb-1">{t('Date')}</div>
                  <div className="text-white/90 font-mono text-sm">{viewingExpense.date}</div>
                </div>
                <div>
                  <div className="text-sm font-medium uppercase tracking-wider text-white/40 mb-1">{t('Category')}</div>
                  <span className="inline-block px-2.5 py-1 bg-[#1E1E2E] border border-white/[0.06] rounded-lg text-sm font-medium text-white/70">{t(viewingExpense.category)}</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium uppercase tracking-wider text-white/40 mb-1">{t('Amount')}</div>
                <div className="text-2xl font-bold text-red-400">- {viewingExpense.amount.toLocaleString()} {currency}</div>
              </div>
              {viewingExpense.note && (
                <div>
                  <div className="text-sm font-medium uppercase tracking-wider text-white/40 mb-1">{t('Note')}</div>
                  <p className="text-sm text-white/80 bg-[#1A1C24] border border-white/[0.06] rounded-xl p-3">{viewingExpense.note}</p>
                </div>
              )}
              <div>
                <div className="text-sm font-medium uppercase tracking-wider text-white/40 mb-2">{t('Photos')} {viewingExpense.photos?.length > 0 ? `(${viewingExpense.photos.length})` : ''}</div>
                {viewingExpense.photos?.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {viewingExpense.photos.map((url: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewPhoto(url)}
                        className="aspect-square rounded-xl overflow-hidden border border-white/[0.06] bg-[#1A1C24] hover:border-primary/40 transition-colors"
                      >
                        <img src={url} alt={`${t('Attachment')} ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/30 text-center py-6 border border-dashed border-white/[0.06] rounded-lg">{t('No photos attached.')}</p>
                )}
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-white/[0.06]">
                <button type="button" onClick={() => { setViewingExpense(null); openEdit(viewingExpense); }} className="btn-secondary">
                  <Edit2 className="w-4 h-4 mr-2" /> {t('Edit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {previewPhoto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setPreviewPhoto(null)}>
          <button onClick={() => setPreviewPhoto(null)} className="absolute top-4 right-4 text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <img src={previewPhoto} alt={t('Attachment')} className="max-w-full max-h-full rounded-2xl shadow-2xl shadow-black/60" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Manage Categories Modal (Admin only) */}
      {catModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setCatModalOpen(false)}>
          <div className="bg-[#12141C] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-white/[0.06] shrink-0">
              <h2 className="text-lg font-semibold text-white/90">{t('Manage Expense Categories')}</h2>
              <button onClick={() => setCatModalOpen(false)} className="text-white/40 hover:text-white/90 transition-colors hover:rotate-90 duration-200 p-1.5 rounded-xl hover:bg-white/[0.04]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5 overflow-y-auto">
              <form onSubmit={handleCatSubmit} className="space-y-3 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <div>
                  <label className="block text-sm font-medium uppercase tracking-wider text-white/40 mb-1.5">{t('Category Name')}</label>
                  <input required type="text" value={catDraft.name} onChange={(e) => setCatDraft({ ...catDraft, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium uppercase tracking-wider text-white/40 mb-1.5">{t('Description')}</label>
                  <input type="text" value={catDraft.description} onChange={(e) => setCatDraft({ ...catDraft, description: e.target.value })} className="input-field" placeholder={t('Optional')} />
                </div>
                <div className="flex justify-end gap-2">
                  {catDraft.id && (
                    <button type="button" onClick={() => setCatDraft({ id: '', name: '', description: '' })} className="px-4 py-2 text-white/40 hover:text-white/90 transition-colors">{t('Cancel')}</button>
                  )}
                  <button type="submit" className="btn-primary">
                    <Plus className="w-4 h-4 mr-1" /> {catDraft.id ? t('Save Changes') : t('Add Category')}
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                {expenseCategories.length === 0 && (
                  <p className="text-sm text-white/30 text-center py-4">{t('No categories yet. Add one above.')}</p>
                )}
                {expenseCategories.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-[#1A1C24] border border-white/[0.06] rounded-lg">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-white/90 block truncate">{c.name}</span>
                      {c.description && <span className="text-xs text-white/40 block truncate">{c.description}</span>}
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <button onClick={() => setCatDraft({ id: c.id, name: c.name, description: c.description || '' })} aria-label={`${t('Edit')} ${c.name}`} className="p-1.5 text-white/40 hover:text-cyan-400 hover:scale-125 transition-all duration-200">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleCatDelete(c.id, c.name)} aria-label={`${t('Delete')} ${c.name}`} className="p-1.5 text-white/40 hover:text-red-500 hover:scale-125 transition-all duration-200">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
