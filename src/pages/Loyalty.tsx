import React, { useState } from 'react';
import { useOffers, useCustomers, useAppConfig, type Offer } from '../hooks/useData';
import { Gift, Award, Plus, Edit2, Trash2, X, Package, Truck, Percent } from 'lucide-react';

export function Loyalty() {
  const { offers, loading, error, addOffer, updateOffer, deleteOffer } = useOffers();
  const { customers } = useCustomers();
  const { config } = useAppConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<Offer>({
    id: '',
    name: '',
    targetKg: config?.defaults?.loyaltyTargetKg || 25,
    rewardKg: config?.defaults?.loyaltyRewardKg || 2,
    discountPercent: 0,
    discountAmount: 0,
    active: true
  });

  const activeOffer = offers.find((o) => o.active) ?? offers[0];
  const target = activeOffer?.targetKg ?? 25;
  const reward = activeOffer?.rewardKg ?? 2;
  const activeDiscountPercent = activeOffer?.discountPercent ?? 0;
  const activeDiscountAmount = activeOffer?.discountAmount ?? 0;

  const openNew = () => {
    setDraft({
      id: '',
      name: '',
      targetKg: config?.defaults?.loyaltyTargetKg || 25,
      rewardKg: config?.defaults?.loyaltyRewardKg || 2,
      discountPercent: 0,
      discountAmount: 0,
      active: true
    });
    setIsModalOpen(true);
  };

  const openEdit = (offer: Offer) => {
    setDraft(offer);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.id) {
      await updateOffer(draft.id, draft);
    } else {
      await addOffer({ name: draft.name, targetKg: draft.targetKg, rewardKg: draft.rewardKg, discountPercent: draft.discountPercent, discountAmount: draft.discountAmount, active: draft.active });
    }
    setIsModalOpen(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Loading offers...</div>;
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg p-4">
          Failed to load offers: {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-lg font-semibold text-navy-900">Loyalty &amp; Offers</h1>
        <button onClick={openNew} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" /> New Offer
        </button>
      </div>

      {activeOffer &&
        <div className="card p-5 relative">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-6 h-6 text-amber-500" />
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Active Promotion</span>
          </div>
          <h2 className="text-lg font-semibold text-navy-900 mb-2">Send {target}kg, Get {reward}kg Free!</h2>
          <p className="text-slate-600 max-w-lg mb-4">The more you ship, the more you save. Keep sending with us and unlock free shipping rewards automatically.</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
              <Package className="w-5 h-5 text-amber-500 mr-3" />
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Target</div>
                <div className="font-bold text-navy-900">{target} kg</div>
              </div>
            </div>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
              <Gift className="w-5 h-5 text-amber-500 mr-3" />
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reward</div>
                <div className="font-bold text-navy-900">{reward} kg free</div>
              </div>
            </div>
            {(activeDiscountPercent > 0 || activeDiscountAmount > 0) && (
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                <Percent className="w-5 h-5 text-amber-500 mr-3" />
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Discount</div>
                  <div className="font-bold text-navy-900">{activeDiscountPercent > 0 ? `${activeDiscountPercent}% off` : `${activeDiscountAmount.toLocaleString()} MGA off`}</div>
                </div>
              </div>
            )}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
              <Truck className="w-5 h-5 text-amber-500 mr-3" />
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</div>
                <div className="font-bold text-green-600">Live</div>
              </div>
            </div>
          </div>
          <button onClick={() => openEdit(activeOffer)} className="mt-4 px-4 py-2 bg-slate-50 border border-slate-200 text-navy-900 rounded-lg hover:bg-slate-100 transition-colors">
            Edit Promotion Rules
          </button>
        </div>
      }

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-navy-900">All Offers</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {offers.map((offer) => (
            <div key={offer.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-navy-900">{offer.name}</div>
                <div className="text-sm text-slate-500">
                  {offer.targetKg}kg &rarr; {offer.rewardKg}kg free
                  {(offer.discountPercent > 0 || offer.discountAmount > 0) && (
                    <span> &bull; {offer.discountPercent > 0 ? `${offer.discountPercent}% off` : `${offer.discountAmount.toLocaleString()} MGA off`}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${offer.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {offer.active ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => openEdit(offer)} aria-label={`Edit ${offer.name}`} className="p-1.5 text-slate-500 hover:text-navy-900 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteOffer(offer.id)} aria-label={`Delete ${offer.name}`} className="p-1.5 text-slate-500 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {offers.length === 0 && <div className="p-6 text-center text-slate-500">No offers yet.</div>}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-navy-900">Customer Progress</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {customers.map((customer) => {
            const progress = customer.totalKgSent % target;
            const percentage = Math.min(progress / target * 100, 100);
            const bonusesEarned = Math.floor(customer.totalKgSent / target);
            return (
              <div key={customer.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="md:w-1/4">
                  <div className="font-medium text-navy-900">{customer.name}</div>
                  <div className="text-sm text-slate-500">{customer.phone}</div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Progress to next reward</span>
                    <span className="text-amber-500 font-medium">{progress}kg / {target}kg</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
                <div className="md:w-1/4 flex justify-end">
                  <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                    <Award className="w-5 h-5 text-amber-500" />
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rewards Earned</div>
                      <div className="font-bold text-navy-900">{bonusesEarned}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-navy-900">{draft.id ? 'Edit Offer' : 'New Offer'}</h2>
              <button onClick={() => setIsModalOpen(false)} aria-label="Close" className="text-slate-500 hover:text-navy-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">Offer Name</label>
                <input required type="text" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">Target (kg)</label>
                  <input required type="number" min="1" value={draft.targetKg || ''} onChange={(e) => setDraft({ ...draft, targetKg: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">Reward (kg free)</label>
                  <input required type="number" min="0" value={draft.rewardKg || ''} onChange={(e) => setDraft({ ...draft, rewardKg: Number(e.target.value) })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">Discount (%)</label>
                  <input type="number" min="0" max="100" value={draft.discountPercent || ''} onChange={(e) => setDraft({ ...draft, discountPercent: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">Discount amount (MGA)</label>
                  <input type="number" min="0" value={draft.discountAmount || ''} onChange={(e) => setDraft({ ...draft, discountAmount: Number(e.target.value) })} className="input-field" />
                </div>
              </div>
              <label className="flex items-center space-x-3">
                <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 focus:ring-offset-white bg-slate-50" />
                <span className="text-slate-700 text-sm">Set as active promotion</span>
              </label>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:text-navy-900 transition-colors">Cancel</button>
                <button type="submit" className="btn-primary">{draft.id ? 'Save Changes' : 'Create Offer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
