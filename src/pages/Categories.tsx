import React, { useState } from 'react';
import { useStore, genId, type Category } from '../store';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
const EMPTY: Category = {
  id: '',
  name: '',
  description: '',
  handlingNotes: ''
};
export function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useStore();
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.id) {
      updateCategory(draft);
    } else {
      addCategory({
        ...draft,
        id: genId()
      });
    }
    setIsModalOpen(false);
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Commodity Categories</h1>
        <button
          onClick={openNew}
          className="flex items-center px-4 py-2 bg-yellow-500 text-zinc-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors">
          
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </button>
      </div>

      {categories.length === 0 ?
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
          No categories yet. Add your first commodity category.
        </div> :

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) =>
        <div
          key={category.id}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col">
          
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-white">
                  {category.name}
                </h3>
                <div className="flex space-x-2">
                  <button
                onClick={() => openEdit(category)}
                aria-label={`Edit ${category.name}`}
                className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                onClick={() => deleteCategory(category.id)}
                aria-label={`Delete ${category.name}`}
                className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors">
                
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-zinc-400 text-sm mb-4 flex-1">
                {category.description}
              </p>

              <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                <div className="text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">
                  Handling Notes
                </div>
                <div className="text-sm text-zinc-300">
                  {category.handlingNotes}
                </div>
              </div>
            </div>
        )}
        </div>
      }

      {isModalOpen &&
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={() => setIsModalOpen(false)}>
        
          <div
          className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}>
          
            <div className="flex justify-between items-center p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">
                {draft.id ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
              onClick={() => setIsModalOpen(false)}
              aria-label="Close"
              className="text-zinc-400 hover:text-white transition-colors">
              
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Category Name
                </label>
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
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500" />
              
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Description
                </label>
                <textarea
                rows={2}
                value={draft.description}
                onChange={(e) =>
                setDraft({
                  ...draft,
                  description: e.target.value
                })
                }
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500 resize-none" />
              
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Handling Notes / Special Requirements
                </label>
                <textarea
                rows={2}
                placeholder="e.g. Fragile, perishable, keep dry"
                value={draft.handlingNotes}
                onChange={(e) =>
                setDraft({
                  ...draft,
                  handlingNotes: e.target.value
                })
                }
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500 resize-none" />
              
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">
                
                  Cancel
                </button>
                <button
                type="submit"
                className="px-4 py-2 bg-yellow-500 text-zinc-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors">
                
                  {draft.id ? 'Save Changes' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>);

}