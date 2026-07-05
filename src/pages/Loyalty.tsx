import React, { useState } from 'react';
import { useStore, genId, type Offer } from '../store';
import { Gift, Award, Plus, Edit2, Trash2, X } from 'lucide-react';
const EMPTY: Offer = {
  id: '',
  name: '',
  targetKg: 25,
  rewardKg: 2,
  active: true
};
export function Loyalty() {
  const { customers, offers, addOffer, updateOffer, deleteOffer } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<Offer>(EMPTY);
  const activeOffer = offers.find((o) => o.active) ?? offers[0];
  const target = activeOffer?.targetKg ?? 25;
  const reward = activeOffer?.rewardKg ?? 2;
  const openNew = () => {
    setDraft(EMPTY);
    setIsModalOpen(true);
  };
  const openEdit = (offer: Offer) => {
    setDraft(offer);
    setIsModalOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.id) {
      updateOffer(draft);
    } else {
      addOffer({
        ...draft,
        id: genId()
      });
    }
    setIsModalOpen(false);
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Loyalty &amp; Offers</h1>
        <button
          onClick={openNew}
          className="flex items-center px-4 py-2 bg-yellow-500 text-zinc-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors">
          
          <Plus className="w-5 h-5 mr-2" />
          New Offer
        </button>
      </div>

      {/* Active Offer Card */}
      {activeOffer &&
      <div className="bg-zinc-900 border border-yellow-500/30 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Gift className="w-32 h-32 text-yellow-500" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-sm font-medium mb-4">
              Active Promotion
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Send {target}kg, Get {reward}kg Free!
            </h2>
            <p className="text-zinc-400 max-w-md mb-6">
              Customers automatically accumulate points based on their phone
              number. Once they hit {target}kg they earn {reward}kg free on
              their next shipment.
            </p>
            <button
            onClick={() => openEdit(activeOffer)}
            className="px-4 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-lg hover:bg-zinc-800 transition-colors">
            
              Edit Promotion Rules
            </button>
          </div>
        </div>
      }

      {/* All offers */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">All Offers</h3>
        </div>
        <div className="divide-y divide-zinc-800">
          {offers.map((offer) =>
          <div
            key={offer.id}
            className="p-4 flex items-center justify-between gap-4">
            
              <div>
                <div className="font-medium text-white">{offer.name}</div>
                <div className="text-sm text-zinc-500">
                  {offer.targetKg}kg &rarr; {offer.rewardKg}kg free
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full ${offer.active ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-400'}`}>
                
                  {offer.active ? 'Active' : 'Inactive'}
                </span>
                <button
                onClick={() => openEdit(offer)}
                aria-label={`Edit ${offer.name}`}
                className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                onClick={() => deleteOffer(offer.id)}
                aria-label={`Delete ${offer.name}`}
                className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors">
                
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {offers.length === 0 &&
          <div className="p-6 text-center text-zinc-500">No offers yet.</div>
          }
        </div>
      </div>

      {/* Customer progress */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">
            Customer Progress
          </h3>
        </div>
        <div className="divide-y divide-zinc-800">
          {customers.map((customer) => {
            const progress = customer.totalKgSent % target;
            const percentage = Math.min(progress / target * 100, 100);
            const bonusesEarned = Math.floor(customer.totalKgSent / target);
            return (
              <div
                key={customer.id}
                className="p-6 flex flex-col md:flex-row md:items-center gap-6">
                
                <div className="md:w-1/4">
                  <div className="font-medium text-white">{customer.name}</div>
                  <div className="text-sm text-zinc-500">{customer.phone}</div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-400">
                      Progress to next reward
                    </span>
                    <span className="text-yellow-500 font-medium">
                      {progress}kg / {target}kg
                    </span>
                  </div>
                  <div className="h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`
                      }} />
                    
                  </div>
                </div>
                <div className="md:w-1/4 flex justify-end">
                  <div className="flex items-center space-x-2 bg-zinc-950 px-4 py-2 rounded-lg border border-zinc-800">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wider">
                        Rewards Earned
                      </div>
                      <div className="font-bold text-white">
                        {bonusesEarned}
                      </div>
                    </div>
                  </div>
                </div>
              </div>);

          })}
        </div>
      </div>

      {isModalOpen &&
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={() => setIsModalOpen(false)}>
        
          <div
          className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}>
          
            <div className="flex justify-between items-center p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">
                {draft.id ? 'Edit Offer' : 'New Offer'}
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
                  Offer Name
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Target (kg)
                  </label>
                  <input
                  required
                  type="number"
                  min="1"
                  value={draft.targetKg || ''}
                  onChange={(e) =>
                  setDraft({
                    ...draft,
                    targetKg: Number(e.target.value)
                  })
                  }
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500" />
                
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Reward (kg free)
                  </label>
                  <input
                  required
                  type="number"
                  min="0"
                  value={draft.rewardKg || ''}
                  onChange={(e) =>
                  setDraft({
                    ...draft,
                    rewardKg: Number(e.target.value)
                  })
                  }
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-yellow-500" />
                
                </div>
              </div>
              <label className="flex items-center space-x-3">
                <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) =>
                setDraft({
                  ...draft,
                  active: e.target.checked
                })
                }
                className="w-4 h-4 rounded border-zinc-700 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-zinc-900 bg-zinc-950" />
              
                <span className="text-zinc-300 text-sm">
                  Set as active promotion
                </span>
              </label>
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
                
                  {draft.id ? 'Save Changes' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>);

}