'use client';

import React, { useState } from 'react';
import { useCategories, type Category } from '@/lib/swr';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const EMPTY: Category = {
  id: '',
  name: '',
  description: '',
  handlingNotes: '',
  pricePerKg: 0
};

export default function Categories() {
  const { categories, loading, error, addCategory, updateCategory, deleteCategory } = useCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<Category>(EMPTY);

  const openNew = () => {
    setDraft(EMPTY);
    setIsModalOpen(true);
  };
  const openEdit = (category: Category) => {
    setDraft(category);
    setIsModalOpen(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.id) {
      await updateCategory(draft.id, draft);
    } else {
      await addCategory({ name: draft.name, description: draft.description, handlingNotes: draft.handlingNotes, pricePerKg: draft.pricePerKg });
    }
    setIsModalOpen(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-white/40">Loading categories...</div>;
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg p-4">
          Failed to load categories: {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-lg font-semibold text-white/90">Commodity Categories</h1>
        <button onClick={openNew} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" /> Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="card p-8 text-center text-white/40">No categories yet. Add your first commodity category.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="card p-5 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-base font-semibold text-white/90">{category.name}</h3>
                <div className="flex space-x-2">
                  <button onClick={() => openEdit(category)} aria-label={`Edit ${category.name}`} className="p-1.5 text-white/50 hover:text-cyan-400 hover:bg-white/[0.04] rounded-lg transition-all duration-200">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteCategory(category.id)} aria-label={`Delete ${category.name}`} className="p-1.5 text-white/40 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-white/60 text-sm mb-4 flex-1">{category.description}</p>
              <div className="bg-[#1A1C24] rounded-lg p-3 border border-white/[0.06]">
                <div className="text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">Handling Notes</div>
                <div className="text-sm text-white/70">{category.handlingNotes}</div>
              </div>
              <div className="bg-[#1A1C24] rounded-lg p-3 border border-white/[0.06]">
                <div className="text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">Price per kg</div>
                <div className="text-sm text-white/70">{(category.pricePerKg ?? 0).toLocaleString()} MGA</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-[#12141C] border border-white/[0.08] rounded-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white/90">{draft.id ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setIsModalOpen(false)} aria-label="Close" className="text-white/40 hover:text-white/90 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-white/60 mb-1">Category Name</label>
                <input required type="text" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-white/60 mb-1">Description</label>
                <textarea rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-white/60 mb-1">Price per kg</label>
                <input required type="number" min="0" step="1" value={draft.pricePerKg ?? 0} onChange={(e) => setDraft({ ...draft, pricePerKg: Number(e.target.value) })} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-white/60 mb-1">Handling Notes / Special Requirements</label>
                <textarea rows={2} value={draft.handlingNotes} onChange={(e) => setDraft({ ...draft, handlingNotes: e.target.value })} className="input-field resize-none" placeholder="e.g. Fragile, perishable, keep dry" />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-white/40 hover:text-white/90 transition-colors">Cancel</button>
                <button type="submit" className="btn-primary">{draft.id ? 'Save Changes' : 'Add Category'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

