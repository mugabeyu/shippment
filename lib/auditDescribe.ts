// Turns a raw audit-log entry (action + details) into a human-readable sentence
// so non-technical users can understand what happened, e.g.
//   { role: 'Staff', email: 'a@b.com' }  ->  "Invited a@b.com as Staff"
// This is a pure, client-safe helper (no server imports) used by the Activity
// feed and the Audit Logs page. Output is localized to the current UI language.

import type { Lang } from '@/lib/i18n';

function getLang(): Lang {
  if (typeof window !== 'undefined') {
    return ((localStorage.getItem('lang') as Lang) || 'en');
  }
  return 'en';
}

function v(x: any): string {
  return x === undefined || x === null || x === '' ? '' : String(x);
}

function route(r: any): string {
  return r === 'retour' ? 'Retour' : r === 'aller' ? 'Aller' : v(r);
}

type Tpl = { en: (d: Record<string, any>) => string; fr: (d: Record<string, any>) => string };

const TEMPLATES: Record<string, Tpl> = {
  shipment_created: {
    en: (d) => `Created shipment ${v(d.trackingNumber)} (${route(d.routeDirection)} route) with ${v(d.lineItems)} item(s), ${v(d.totalWeight)} kg`,
    fr: (d) => `Expédition ${v(d.trackingNumber)} créée (trajet ${route(d.routeDirection)}), ${v(d.lineItems)} article(s), ${v(d.totalWeight)} kg`,
  },
  shipment_updated: {
    en: (d) => `Updated shipment ${v(d.trackingNumber)}`,
    fr: (d) => `Expédition ${v(d.trackingNumber)} mise à jour`,
  },
  shipment_deleted: {
    en: (d) => `Deleted shipment ${v(d.trackingNumber)}${d.weightKg != null ? ` (${v(d.weightKg)} kg)` : ''}`,
    fr: (d) => `Expédition ${v(d.trackingNumber)} supprimée${d.weightKg != null ? ` (${v(d.weightKg)} kg)` : ''}`,
  },
  shipment_status_changed: {
    en: (d) => `Changed status of shipment ${v(d.trackingNumber)} to ${v(d.status)}`,
    fr: (d) => `Statut de l'expédition ${v(d.trackingNumber)} changé vers ${v(d.status)}`,
  },

  expense_created: {
    en: (d) => `Added ${v(d.category)} expense of ${v(d.amount)}${d.note ? ` — ${v(d.note)}` : ''}`,
    fr: (d) => `Dépense ${v(d.category)} ajoutée : ${v(d.amount)}${d.note ? ` — ${v(d.note)}` : ''}`,
  },
  expense_updated: {
    en: (d) => `Updated ${v(d.category)} expense (${v(d.amount)})`,
    fr: (d) => `Dépense ${v(d.category)} mise à jour (${v(d.amount)})`,
  },
  expense_deleted: {
    en: () => `Deleted an expense`,
    fr: () => `Dépense supprimée`,
  },

  customer_created: {
    en: (d) => `Added customer ${v(d.name)}${d.phone ? ` (${v(d.phone)})` : ''}`,
    fr: (d) => `Client ${v(d.name)} ajouté${d.phone ? ` (${v(d.phone)})` : ''}`,
  },
  customer_updated: {
    en: (d) => {
      let s = `Updated customer ${v(d.name)}`;
      if (d.active !== undefined && d.active !== null) s += ` — status: ${d.active ? 'Active' : 'Blocked'}`;
      return s;
    },
    fr: (d) => {
      let s = `Client ${v(d.name)} mis à jour`;
      if (d.active !== undefined && d.active !== null) s += ` — statut : ${d.active ? 'Actif' : 'Bloqué'}`;
      return s;
    },
  },

  category_created: {
    en: (d) => `Created category ${v(d.name)}`,
    fr: (d) => `Catégorie ${v(d.name)} créée`,
  },
  category_updated: {
    en: (d) => `Updated category ${v(d.name)}`,
    fr: (d) => `Catégorie ${v(d.name)} mise à jour`,
  },
  category_deleted: {
    en: () => `Deleted a category`,
    fr: () => `Catégorie supprimée`,
  },

  shipping_item_created: {
    en: (d) => `Added item "${v(d.item)}" (Aller: ${v(d.allerPrice)}, Retour: ${v(d.retourPrice)})`,
    fr: (d) => `Article « ${v(d.item)} » ajouté (Aller : ${v(d.allerPrice)}, Retour : ${v(d.retourPrice)})`,
  },
  shipping_item_updated: {
    en: () => `Updated a shipping item`,
    fr: () => `Article d'expédition mis à jour`,
  },
  shipping_item_deleted: {
    en: () => `Deleted a shipping item`,
    fr: () => `Article d'expédition supprimé`,
  },

  offer_created: {
    en: (d) => `Created offer "${v(d.name)}"${d.discountPercent != null ? ` (${v(d.discountPercent)}% off)` : ''}`,
    fr: (d) => `Offre « ${v(d.name)} » créée${d.discountPercent != null ? ` (${v(d.discountPercent)} % de remise)` : ''}`,
  },
  offer_updated: {
    en: (d) => {
      let s = `Updated offer "${v(d.name)}"`;
      if (d.active !== undefined && d.active !== null) s += ` — ${d.active ? 'Active' : 'Inactive'}`;
      return s;
    },
    fr: (d) => {
      let s = `Offre « ${v(d.name)} » mise à jour`;
      if (d.active !== undefined && d.active !== null) s += ` — ${d.active ? 'Active' : 'Inactive'}`;
      return s;
    },
  },
  offer_deleted: {
    en: () => `Deleted an offer`,
    fr: () => `Offre supprimée`,
  },

  staff_invited: {
    en: (d) => `Invited ${v(d.email)} as ${v(d.role)}`,
    fr: (d) => `${v(d.email)} invité(e) en tant que ${v(d.role)}`,
  },
  staff_self_registered: {
    en: (d) => `${v(d.email)} registered as ${v(d.role)}`,
    fr: (d) => `${v(d.email)} inscrit(e) en tant que ${v(d.role)}`,
  },
  staff_deleted: {
    en: (d) => `Removed staff ${v(d.email)}`,
    fr: (d) => `Membre du personnel ${v(d.email)} supprimé(e)`,
  },

  settings_updated: {
    en: (d) => `Updated company settings${d.companyName ? ` for ${v(d.companyName)}` : ''}`,
    fr: (d) => `Paramètres de l'entreprise mis à jour${d.companyName ? ` pour ${v(d.companyName)}` : ''}`,
  },
  settings_created: {
    en: (d) => `Set up company settings${d.companyName ? ` for ${v(d.companyName)}` : ''}`,
    fr: (d) => `Paramètres de l'entreprise configurés${d.companyName ? ` pour ${v(d.companyName)}` : ''}`,
  },

  admin_login: {
    en: (d) => `Signed in${d.device ? ` from ${v(d.device)}` : ''}`,
    fr: (d) => `Connecté(e)${d.device ? ` depuis ${v(d.device)}` : ''}`,
  },

  work_session_started: {
    en: () => `Started a work session`,
    fr: () => `Session de travail démarrée`,
  },
  work_session_ended: {
    en: () => `Ended their work session`,
    fr: () => `Session de travail terminée`,
  },
};

export function describeAudit(
  action: string,
  details: Record<string, any> | null | undefined
): string {
  const tpl = TEMPLATES[action];
  if (tpl) {
    const lang = getLang();
    return (lang === 'fr' ? tpl.fr : tpl.en)(details || {});
  }

  // Fallback: humanize the known key/value pairs (never raw JSON).
  const d = details || {};
  const entries = Object.entries(d).filter(
    ([, val]) => val !== undefined && val !== null && val !== ''
  );
  if (entries.length === 0) return '';
  return entries
    .map(([k, val]) => `${humanize(k)}: ${typeof val === 'object' ? JSON.stringify(val) : val}`)
    .join(', ');
}

// Translated action titles shown as the card heading / filter dropdown options.
const FR_LABELS: Record<string, string> = {
  shipment_created: 'Expédition créée',
  shipment_updated: 'Expédition mise à jour',
  shipment_deleted: 'Expédition supprimée',
  shipment_status_changed: 'Statut d\'expédition modifié',
  expense_created: 'Dépense créée',
  expense_updated: 'Dépense mise à jour',
  expense_deleted: 'Dépense supprimée',
  customer_created: 'Client ajouté',
  customer_updated: 'Client mis à jour',
  category_created: 'Catégorie créée',
  category_updated: 'Catégorie mise à jour',
  category_deleted: 'Catégorie supprimée',
  shipping_item_created: 'Article créé',
  shipping_item_updated: 'Article mis à jour',
  shipping_item_deleted: 'Article supprimé',
  offer_created: 'Offre créée',
  offer_updated: 'Offre mise à jour',
  offer_deleted: 'Offre supprimée',
  staff_invited: 'Membre invité',
  staff_self_registered: 'Membre inscrit',
  staff_deleted: 'Membre supprimé',
  settings_updated: 'Paramètres mis à jour',
  settings_created: 'Paramètres créés',
  admin_login: 'Connexion',
  work_session_started: 'Session démarrée',
  work_session_ended: 'Session terminée',
};

export function actionLabel(action: string): string {
  const lang = getLang();
  if (lang === 'fr' && FR_LABELS[action]) return FR_LABELS[action];
  return formatAction(action);
}

export function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

// Where clicking an audit log entry should navigate to. Shipments/customers
// have their own detail pages so we deep-link straight to the record; every
// other action type links to its management list page instead.
export function auditLogHref(action: string, details: Record<string, any> | null | undefined): string | null {
  const d = details || {};
  if (action.startsWith('shipment_')) return d.id ? `/shipment/${d.id}` : null;
  if (action.startsWith('customer_')) return d.id ? `/customer/${d.id}` : null;
  if (action.startsWith('category_') || action.startsWith('shipping_item_')) return '/categories';
  if (action.startsWith('offer_')) return '/offers';
  if (action.startsWith('staff_')) return '/staff';
  if (action.startsWith('expense_')) return '/expenses';
  if (action.startsWith('settings_')) return '/settings';
  return null;
}

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
