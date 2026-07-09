'use client';

import React, { useState } from 'react';
import { useOffers, useCustomers, useAppConfig, useSettings, type Offer } from '@/lib/swr';
import { Gift, Award, Plus, Edit2, Trash2, X, Package, Truck, Percent } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function Loyalty() {
  const t = useT();
  const { offers, loading, error, addOffer, updateOffer, deleteOffer } = useOffers();
  const { customers } = useCustomers();
  const { config } = useAppConfig();
  const { settings } = useSettings();
  const currency = settings?.currency || config?.defaults?.currency || 'MGA';
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
    return <div className="flex items-center justify-center h-64 text-white/40">Loading offers...</div>;
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg p-4">
          Failed to load offers: {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl font-semibold text-white/90">{t('Loyalty & Offers')}</h1>
        <button onClick={openNew} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" /> {t('New Offer')}
        </button>
      </div>

      {activeOffer &&
        <div className="card p-5 relative">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-6 h-6 text-amber-500" />
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">{t('Active Promotion')}</span>
          </div>
          <h2 className="text-lg font-semibold text-white/90 mb-2">{t('Send')} {target}kg, {t('Get')} {reward}kg {t('Free!')}</h2>
          <p className="text-white/60 max-w-lg mb-4">{t('Customers earn')} {reward}kg {t('free')} {t('every time their lifetime shipped weight crosses a')} {target}kg {t('milestone')}. {t('The discount is applied automatically when creating their milestone-crossing shipment.')}</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2.5">
              <Package className="w-5 h-5 text-amber-500 mr-3" />
              <div>
                <div className="text-sm font-medium text-white/40 uppercase tracking-wider">{t('Target')}</div>
                <div className="font-bold text-white/90">{target} kg</div>
              </div>
            </div>
            <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2.5">
              <Gift className="w-5 h-5 text-amber-500 mr-3" />
              <div>
                <div className="text-sm font-medium text-white/40 uppercase tracking-wider">{t('Reward')}</div>
                <div className="font-bold text-white/90">{reward} kg {t('free')}</div>
              </div>
            </div>
            {(activeDiscountPercent > 0 || activeDiscountAmount > 0) && (
              <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2.5">
                <Percent className="w-5 h-5 text-amber-500 mr-3" />
                <div>
                  <div className="text-sm font-medium text-white/40 uppercase tracking-wider">{t('Discount')}</div>
                  <div className="font-bold text-white/90">{activeDiscountPercent > 0 ? `${activeDiscountPercent}% off` : `${activeDiscountAmount.toLocaleString()} {currency} off`}</div>
                </div>
              </div>
            )}
            <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2.5">
              <Truck className="w-5 h-5 text-amber-500 mr-3" />
              <div>
                <div className="text-sm font-medium text-white/40 uppercase tracking-wider">{t('Status')}</div>
                <div className="font-bold text-green-600">{t('Live')}</div>
              </div>
            </div>
          </div>
            <button onClick={() => openEdit(activeOffer)} className="btn-primary mt-4">
              {t('Edit Promotion Rules')}
            </button>
        </div>
      }

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-lg font-semibold text-white/90">{t('All Offers')}</h3>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {offers.map((offer) => (
            <div key={offer.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-white/90">{offer.name}</div>
                <div className="text-sm text-white/40">
                  {offer.targetKg}kg &rarr; {offer.rewardKg}kg free
                  {(offer.discountPercent > 0 || offer.discountAmount > 0) && (
                    <span> &bull; {offer.discountPercent > 0 ? `${offer.discountPercent}% off` : `${offer.discountAmount.toLocaleString()} {currency} off`}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-sm font-medium rounded-full ${offer.active ? 'bg-green-100 text-green-700' : 'bg-white/[0.04] text-white/60'}`}>
                  {offer.active ? t('Active') : t('Inactive')}
                </span>
                <button onClick={() => openEdit(offer)} aria-label={`Edit ${offer.name}`} className="p-1.5 text-white/40 hover:text-white/90 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteOffer(offer.id)} aria-label={`Delete ${offer.name}`} className="p-1.5 text-white/40 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {offers.length === 0 && <div className="p-6 text-center text-white/40">No offers yet.</div>}
        </div>
      </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="text-lg font-semibold text-white/90">{t('Customer Progress')}</h3>
            <p className="text-sm text-white/40 mt-0.5">{t('Each')} {target}kg {t('milestone earns')} {reward}kg {t('free')} {t('on the crossing shipment')}</p>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {customers.map((customer) => {
              const milestonesCompleted = Math.floor(customer.totalKgSent / target);
              const progress = Math.max(0, customer.totalKgSent - milestonesCompleted * (target + reward));
              const percentage = Math.min(progress / target * 100, 100);
              const bonusesEarned = milestonesCompleted;
              const kgToNext = target - progress;
              return (
              <div key={customer.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="md:w-1/4">
                  <div className="font-medium text-white/90">{customer.name}</div>
                  <div className="text-sm text-white/40">{customer.phone}</div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">{t('Progress to next')} {reward}kg {t('bonus')}</span>
                    <span className="text-amber-500 font-medium">{progress}kg / {target}kg ({t('need')} {kgToNext}kg {t('more')})</span>
                  </div>
                  <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
                <div className="md:w-1/4 flex justify-end">
                  <div className="flex items-center space-x-2 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                    <Award className="w-5 h-5 text-amber-500" />
                    <div>
                      <div className="text-sm font-medium text-amber-600 uppercase tracking-wider">{t('Rewards Earned')}</div>
                      <div className="font-bold text-white/90">{bonusesEarned} × {reward}kg {t('free')}</div>
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
          <div className="bg-[#12141C] border border-white/[0.08] rounded-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white/90">{draft.id ? t('Edit Offer') : t('New Offer')}</h2>
              <button onClick={() => setIsModalOpen(false)} aria-label="Close" className="text-white/40 hover:text-white/90 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium uppercase tracking-wider text-white/60 mb-1">{t('Offer Name')}</label>
                <input required type="text" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium uppercase tracking-wider text-white/60 mb-1">{t('Target (kg)')}</label>
                  <input required type="number" min="1" value={draft.targetKg || ''} onChange={(e) => setDraft({ ...draft, targetKg: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium uppercase tracking-wider text-white/60 mb-1">{t('Reward (kg free)')}</label>
                  <input required type="number" min="0" value={draft.rewardKg || ''} onChange={(e) => setDraft({ ...draft, rewardKg: Number(e.target.value) })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium uppercase tracking-wider text-white/60 mb-1">{t('Discount (%)')}</label>
                  <input type="number" min="0" max="100" value={draft.discountPercent || ''} onChange={(e) => setDraft({ ...draft, discountPercent: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium uppercase tracking-wider text-white/60 mb-1">{t('Discount amount')} ({currency})</label>
                  <input type="number" min="0" value={draft.discountAmount || ''} onChange={(e) => setDraft({ ...draft, discountAmount: Number(e.target.value) })} className="input-field" />
                </div>
              </div>
              <label className="flex items-center space-x-3">
                <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="w-4 h-4 rounded border-white/[0.15] text-amber-500 focus:ring-amber-500 focus:ring-offset-white bg-white/[0.03]" />
                <span className="text-white/70 text-sm">{t('Set as active promotion')}</span>
              </label>
              <div className="pt-4 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-white/40 hover:text-white/90 transition-colors">{t('Cancel')}</button>
              <button type="submit" className="btn-primary">{draft.id ? t('Save Changes') : t('Create Offer')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

