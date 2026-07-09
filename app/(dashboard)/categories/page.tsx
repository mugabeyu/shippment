'use client';

import React, { useState, useMemo } from 'react';
import { useCategories, useShippingItems, useSettings, type Category, type ShippingItem } from '@/lib/swr';
import { Plus, Edit2, Trash2, X, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { useT } from '@/lib/i18n';

const EMPTY_CAT: Category = {
  id: '',
  name: '',
  description: '',
  handlingNotes: '',
  pricePerKg: 0
};

export default function Categories() {
  const t = useT();
  const { categories, loading, error, addCategory, updateCategory, deleteCategory } = useCategories();
  const { shippingItems, addItem, deleteItem } = useShippingItems();
  const { settings } = useSettings();
  const currency = settings?.currency || 'MGA';

  const [catModal, setCatModal] = useState(false);
  const [catDraft, setCatDraft] = useState<Category>(EMPTY_CAT);

  const [itemModalCategoryId, setItemModalCategoryId] = useState<string>('');
  const [newItem, setNewItem] = useState({ item: '', allerPrice: '', retourPrice: '' });
  const [itemModalOpen, setItemModalOpen] = useState(false);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group items by categoryId
  const itemsByCategory = useMemo(() => {
    const map: Record<string, ShippingItem[]> = {};
    for (const it of shippingItems) {
      const cid = it.categoryId;
      if (!map[cid]) map[cid] = [];
      map[cid].push(it);
    }
    return map;
  }, [shippingItems]);

  const toggleExpand = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // --- Category CRUD ---
  const openNewCat = () => { setCatDraft(EMPTY_CAT); setCatModal(true); };
  const openEditCat = (c: Category) => { setCatDraft(c); setCatModal(true); };
  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (catDraft.id) {
      await updateCategory(catDraft.id, catDraft);
    } else {
      await addCategory({ name: catDraft.name, description: catDraft.description, handlingNotes: catDraft.handlingNotes, pricePerKg: 0 });
    }
    setCatModal(false);
  };

  // --- Item CRUD ---
  const openAddItem = (categoryId: string) => {
    setItemModalCategoryId(categoryId);
    setNewItem({ item: '', allerPrice: '', retourPrice: '' });
    setItemModalOpen(true);
  };
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.item.trim() || !newItem.allerPrice) return;
    await addItem({
      categoryId: itemModalCategoryId,
      item: newItem.item.trim(),
      allerPrice: Number(newItem.allerPrice),
      retourPrice: newItem.retourPrice ? Number(newItem.retourPrice) : null
    });
    setItemModalOpen(false);
  };
  const handleDeleteItem = async (id: string) => { await deleteItem(id); };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-white/40">Loading categories...</div>;
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg p-4">
          Failed to load categories: {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white/90">{t('Categories & Shipping Items')}</h1>
          <p className="text-xs text-white/40 mt-1">{t('Create categories, then add items with Aller (Mauritius→Madagascar) and Retour (Madagascar→Mauritius) pricing.')}</p>
        </div>
        <button onClick={openNewCat} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" /> {t('New Category')}
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="card p-8 text-center text-white/40">{t('No categories yet. Create a category first, then add items to it.')}</div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const items = itemsByCategory[cat.id] || [];
            const expanded = expandedCategories.has(cat.id);
            return (
              <div key={cat.id} className="card overflow-hidden">
                {/* Category header */}
                <div className="flex items-center justify-between p-4 bg-[#1A1C24]">
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0"
                  >
                    <span className="text-white/30 shrink-0">
                      {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-white/90">{cat.name}</h3>
                      <p className="text-xs text-white/40 mt-0.5">
                        {items.length} item{items.length !== 1 ? 's' : ''}
                        {cat.description ? ` — ${cat.description}` : ''}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openAddItem(cat.id)} className="btn-secondary text-xs py-1.5 px-3" title={t('Add Item')}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> {t('Add Item')}
                    </button>
                    <button onClick={() => openEditCat(cat)} aria-label={`${t('Edit')} ${cat.name}`} className="p-2 text-white/50 hover:text-cyan-400 hover:bg-white/[0.04] rounded-lg transition-all duration-200">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded items list */}
                {expanded && (
                  <div className="p-4 space-y-2 border-t border-white/[0.06]">
                    {items.length === 0 ? (
                      <p className="text-sm text-white/30 text-center py-4">{t('No items in this category yet. Click "Add Item" to add one.')}</p>
                    ) : (
                      items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between p-3 bg-[#1A1C24] border border-white/[0.06] rounded-lg">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-white/90 block truncate">{it.item}</span>
                            <div className="flex gap-3 mt-1 text-xs">
                              <span className="text-emerald-400">Aller: {it.allerPrice.toLocaleString()} {currency}</span>
                              <span className="text-amber-400">
                                Retour: {it.retourPrice != null ? `${it.retourPrice.toLocaleString()} {currency}` : '—'}
                              </span>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteItem(it.id)} aria-label="Delete item" className="p-1.5 text-white/40 hover:text-red-500 transition-colors ml-2 shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Category Modal */}
      {catModal && (
        <Modal onClose={() => setCatModal(false)} title={catDraft.id ? t('Edit Category') : t('New Category')}>
          <form onSubmit={handleCatSubmit} className="p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-white/60 mb-1">{t('Category Name')}</label>
              <input required type="text" value={catDraft.name} onChange={(e) => setCatDraft({ ...catDraft, name: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-white/60 mb-1">{t('Description')}</label>
              <textarea rows={2} value={catDraft.description} onChange={(e) => setCatDraft({ ...catDraft, description: e.target.value })} className="input-field resize-none" />
            </div>
            <div className="pt-4 flex justify-end space-x-3">
              <button type="button" onClick={() => setCatModal(false)} className="px-4 py-2 text-white/40 hover:text-white/90 transition-colors">{t('Cancel')}</button>
              <button type="submit" className="btn-primary">{catDraft.id ? t('Save Changes') : t('Create Category')}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Item Modal */}
      {itemModalOpen && (
        <Modal onClose={() => setItemModalOpen(false)} title={t('Add Shipping Item')}>
          <form onSubmit={handleAddItem} className="p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-white/60 mb-1">{t('Category')}</label>
              <select
                required
                value={itemModalCategoryId}
                onChange={(e) => setItemModalCategoryId(e.target.value)}
                className="input-field"
              >
                <option value="" disabled>{t('Select a category')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium uppercase tracking-wider text-white/60 mb-1">{t('Item Name')}</label>
              <input required type="text" value={newItem.item} onChange={(e) => setNewItem({ ...newItem, item: e.target.value })} className="input-field" placeholder="e.g. Téléphone (sans accessoires)" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium uppercase tracking-wider text-emerald-400 mb-1">{t('Prix Aller (Rs)')}</label>
                <input required type="number" min="0" value={newItem.allerPrice} onChange={(e) => setNewItem({ ...newItem, allerPrice: e.target.value })} className="input-field" placeholder="500" />
                <p className="text-xs text-white/30 mt-1">{t('Mauritius → Madagascar')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium uppercase tracking-wider text-amber-400 mb-1">{t('Prix Retour (Rs)')}</label>
                <input type="number" min="0" value={newItem.retourPrice} onChange={(e) => setNewItem({ ...newItem, retourPrice: e.target.value })} className="input-field" placeholder={t('Leave empty if N/A')} />
                <p className="text-xs text-white/30 mt-1">{t('Madagascar → Mauritius')}</p>
              </div>
            </div>
            <div className="pt-4 flex justify-end space-x-3">
              <button type="button" onClick={() => setItemModalOpen(false)} className="px-4 py-2 text-white/40 hover:text-white/90 transition-colors">{t('Cancel')}</button>
              <button type="submit" className="btn-primary"><Plus className="w-4 h-4 mr-1" /> {t('Add Item')}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#12141C] border border-white/[0.08] rounded-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white/90">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-white/40 hover:text-white/90 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
