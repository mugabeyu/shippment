'use client';

import { create } from 'zustand';

export type Lang = 'en' | 'fr';

// French translations are keyed by their English source string so that any
// untranslated text gracefully falls back to English.
const fr: Record<string, string> = {
  // Sidebar / navigation
  'Dashboard': 'Tableau de bord',
  'Shipments': 'Expéditions',
  'Customers': 'Clients',
  'Categories': 'Catégories',
  'Offers': 'Offres',
  'Expenses': 'Dépenses',
  'Reports': 'Rapports',
  'Notifications': 'Notifications',
  'Settings': 'Paramètres',
  'Staff': 'Personnel',
  'OPERATIONS': 'OPÉRATIONS',
  'MANAGEMENT': 'GESTION',
  'SYSTEM': 'SYSTÈME',
  'Home': 'Accueil',
  'Loading...': 'Chargement...',

  // Topbar / profile
  'Profile': 'Profil',
  'Logout': 'Déconnexion',
  'System Online': 'Système en ligne',
  'Session Expiring': 'Session expirante',
  'Logout in': 'Déconnexion dans',
  'min.': 'min.',
  'Dismiss': 'Ignorer',

  // Generic actions
  'Cancel': 'Annuler',
  'Save Changes': 'Enregistrer',
  'Save': 'Enregistrer',
  'Delete': 'Supprimer',
  'Edit': 'Modifier',
  'Add': 'Ajouter',
  'Create': 'Créer',
  'Close': 'Fermer',
  'Active': 'Actif',
  'Inactive': 'Inactif',
  'Blocked': 'Bloqué',
  'All Statuses': 'Tous les statuts',
  'All Actions': 'Toutes les actions',
  'Search': 'Rechercher',
  'No data found.': 'Aucune donnée trouvée.',

  // Dashboard
  'DASHBOARD': 'TABLEAU DE BORD',
  'Live Operations Overview': 'Aperçu des opérations en direct',
  'Total Revenue': 'Revenu total',
  'Total Expenses': 'Dépenses totales',
  'Net Profit': 'Bénéfice net',
  'Pending': 'En attente',
  'Monthly Volume': 'Volume mensuel',
  'Shipment KG over the last 7 months': 'KG expédiés au cours des 7 derniers mois',
  'Recent Activity': 'Activité récente',
  'Latest 5 shipments': '5 dernières expéditions',
  'No shipments yet': 'Aucune expédition pour le moment',
  'Top Shippers': 'Meilleurs expéditeurs',
  'By total volume': 'Par volume total',
  'Loyalty Progress': 'Progression de fidélité',
  'Next': 'Prochain',
  'bonus': 'bonus',
  'free': 'gratuit',
  'Profitable': 'Rentable',
  'Loss': 'Perte',
  'paid shipments': 'expéditions payées',
  'delivered': 'livrées',
  'entries': 'entrées',

  // Shipments
  'Loading shipments...': 'Chargement des expéditions...',
  'Export CSV': 'Exporter CSV',
  'New Shipment': 'Nouvelle expédition',
  'Failed to load shipments:': 'Échec du chargement des expéditions :',
  'Search by tracking number or customer...': 'Rechercher par numéro de suivi ou client...',
  'Search customers...': 'Rechercher des clients...',
  'No customers found': 'Aucun client trouvé',
  'Tracking': 'Suivi',
  'Customer': 'Client',
  'Route': 'Itinéraire',
  'Details': 'Détails',
  'Status': 'Statut',
  'Receipt': 'Reçu',
  'Aller': 'Aller',
  'Retour': 'Retour',
  'Mark Delivered': 'Marquer comme livré',
  'No shipments found.': 'Aucune expédition trouvée.',
  'Create New Shipment': 'Créer une nouvelle expédition',
  'Route Direction': 'Sens de l\'itinéraire',
  'Aller (Madagascar → Mauritius)': 'Aller (Madagascar → Maurice)',
  'Retour (Mauritius → Madagascar)': 'Retour (Maurice → Madagascar)',
  'Description of Goods': 'Description des marchandises',
  'Line Items': 'Articles',
  'Category': 'Catégorie',
  'Item': 'Article',
  'Weight (kg)': 'Poids (kg)',
  'Quantity': 'Quantité',
  'No items added yet. Select a category, then an item, and click Add.': 'Aucun article ajouté. Choisissez une catégorie, puis un article, et cliquez sur Ajouter.',
  'Goods Photos (up to 3)': 'Photos des marchandises (jusqu\'à 3)',
  'Click to upload (max 3)': 'Cliquez pour téléverser (max 3)',
  'Uploading...': 'Téléversement...',
  'Payment Method': 'Mode de paiement',
  'Payment Status': 'Statut de paiement',
  'Unpaid': 'Non payé',
  'Paid': 'Payé',
  'Price Preview': 'Aperçu du prix',
  'Subtotal': 'Sous-total',
  'Offer discount': 'Remise offre',
  'Estimated total': 'Total estimé',
  'Create Shipment': 'Créer l\'expédition',
  'Share PDF': 'Partager le PDF',

  // Customers
  'Add Customer': 'Ajouter un client',
  'Search by name or phone...': 'Rechercher par nom ou téléphone...',
  'Loyalty:': 'Fidélité :',
  'kg sent': 'kg envoyés',
  'Notes:': 'Notes :',
  'No customers found.': 'Aucun client trouvé.',
  'Edit Customer': 'Modifier le client',
  'Add New Customer': 'Ajouter un nouveau client',
  'Full Name': 'Nom complet',
  'Phone Number (Loyalty ID)': 'Numéro de téléphone (ID de fidélité)',
  'Email Address': 'Adresse e-mail',
  'Address': 'Adresse',
  'Save Customer': 'Enregistrer le client',

  // Staff
  'Staff Management': 'Gestion du personnel',
  'Manage existing staff and approve pending access.': 'Gérez le personnel existant et approuvez les accès en attente.',
  'Search by name or email...': 'Rechercher par nom ou e-mail...',
  'Pending Invite': 'Invitation en attente',
  'Resend Invite': 'Renvoyer l\'invitation',
  'Block': 'Bloquer',
  'Unblock': 'Débloquer',
  'You cannot block your own account.': 'Vous ne pouvez pas bloquer votre propre compte.',
  'Only admins can block staff.': 'Seuls les admins peuvent bloquer le personnel.',
  'has been approved as': 'a été approuvé en tant que',
  'Failed to approve staff': 'Échec de l\'approbation du personnel',
  'has been unblocked.': 'a été débloqué.',
  'has been blocked.': 'a été bloqué.',
  'Failed to update staff status': 'Échec de la mise à jour du statut du personnel',
  'Invitation resent.': 'Invitation renvoyée.',
  'Failed to resend invitation': 'Échec du renvoi de l\'invitation',
  'Loading staff...': 'Chargement du personnel...',

  // Categories
  'Categories & Shipping Items': 'Catégories et articles d\'expédition',
  'Create categories, then add items with Aller (Madagascar→Mauritius) and Retour (Mauritius→Madagascar) pricing.': 'Créez des catégories, puis ajoutez des articles avec les tarifs Aller (Madagascar→Maurice) et Retour (Maurice→Madagascar).',
  'New Category': 'Nouvelle catégorie',
  'No categories yet. Create a category first, then add items to it.': 'Aucune catégorie pour le moment. Créez d\'abord une catégorie, puis ajoutez-y des articles.',
  'Add Item': 'Ajouter un article',
  'No items in this category yet. Click "Add Item" to add one.': 'Aucun article dans cette catégorie pour le moment. Cliquez sur « Ajouter un article ».',
  'Edit Category': 'Modifier la catégorie',
  'Category Name': 'Nom de la catégorie',
  'Description': 'Description',
  'Create Category': 'Créer la catégorie',
  'Add Shipping Item': 'Ajouter un article d\'expédition',
  'Item Name': 'Nom de l\'article',
  'Select a category': 'Sélectionnez une catégorie',
  'Prix Aller (Rs)': 'Prix Aller (Rs)',
  'Madagascar → Mauritius': 'Madagascar → Maurice',
  'Prix Retour (Rs)': 'Prix Retour (Rs)',
  'Mauritius → Madagascar': 'Maurice → Madagascar',
  'item': 'article',
  'items': 'articles',
  'Leave empty if N/A': 'Laisser vide si N/A',

  // Offers
  'Loyalty & Offers': 'Fidélité et offres',
  'New Offer': 'Nouvelle offre',
  'Failed to load offers:': 'Échec du chargement des offres :',
  'Active Promotion': 'Promotion active',
  'Send': 'Envoyer',
  'Get': 'Obtenir',
  'Free!': 'Gratuit !',
  'kg free': 'kg gratuits',
  'Target': 'Cible',
  'Reward': 'Récompense',
  'Discount': 'Remise',
  'Live': 'En direct',
  'Customers earn': 'Les clients gagnent',
  'every time their lifetime shipped weight crosses a': 'à chaque fois que leur poids expédié à vie franchit un',
  'milestone': 'jalon',
  'The discount is applied automatically when creating their milestone-crossing shipment.': 'La remise est appliquée automatiquement lors de la création de leur expédition franchissant le jalon.',
  'Each': 'Chaque',
  'milestone earns': 'jalon rapporte',
  'on the crossing shipment': 'sur l\'expédition franchissant le jalon',
  'All Offers': 'Toutes les offres',
  'No offers yet.': 'Aucune offre pour le moment.',
  'Customer Progress': 'Progression des clients',
  'Progress to next': 'Progression vers le prochain',
  'need': 'besoin de',
  'kg more': 'kg de plus',
  'Rewards Earned': 'Récompenses obtenues',
  'Offer Name': 'Nom de l\'offre',
  'Target (kg)': 'Cible (kg)',
  'Reward (kg free)': 'Récompense (kg gratuits)',
  'Discount (%)': 'Remise (%)',
  'Discount amount': 'Montant de la remise',
  'Set as active promotion': 'Définir comme promotion active',

  // Expenses
  'Track all business costs': 'Suivez tous les coûts de l\'entreprise',
  'Add Expense': 'Ajouter une dépense',
  'This Month': 'Ce mois-ci',
  'Current month': 'Mois en cours',
  'Unique categories': 'Catégories uniques',
  'Search expenses...': 'Rechercher des dépenses...',
  'Date': 'Date',
  'Amount': 'Montant',
  'Note': 'Note',
  'Actions': 'Actions',
  'No expenses found.': 'Aucune dépense trouvée.',
  'Edit Expense': 'Modifier la dépense',
  'Attachment URL': 'URL de la pièce jointe',
  'Add a description...': 'Ajouter une description...',
  'Select...': 'Sélectionner...',
  'Air Tickets': 'Billets d\'avion',
  'Customs': 'Douanes',
  'Freight': 'Fret',
  'Packaging': 'Emballage',
  'Fuel': 'Carburant',
  'Maintenance': 'Maintenance',
  'Office Supplies': 'Fournitures de bureau',
  'Utilities': 'Services publics',
  'Rent': 'Loyer',
  'Insurance': 'Assurance',
  'Marketing': 'Marketing',
  'Salaries': 'Salaires',
  'Taxes': 'Impôts',
  'Legal': 'Juridique',
  'Software': 'Logiciels',
  'Other': 'Autre',

  // Reports
  'Reports & Exports': 'Rapports et exportations',
  'From': 'De',
  'To': 'À',
  'No data for this report.': 'Aucune donnée pour ce rapport.',
  'Revenue': 'Revenu',
  'Total KG': 'KG total',
  'Total KG Sent': 'KG envoyés au total',
  'Name': 'Nom',
  'Phone': 'Téléphone',
  'Email': 'E-mail',
  'Payment': 'Paiement',
  'CSV': 'CSV',
  'PDF': 'PDF',
  'Range: All time': 'Période : Tout le temps',

  // Notifications / Activity
  'Activity': 'Activité',
  'Every action performed across the system, and who did it.': 'Chaque action effectuée dans le système, et par qui.',
  'Failed to load activity:': 'Échec du chargement de l\'activité :',
  'Search by staff name, email or action...': 'Rechercher par nom, e-mail ou action du personnel...',
  'No activity to display.': 'Aucune activité à afficher.',

  // Audit
  'Audit Logs': 'Journaux d\'audit',
  'Track every admin activity across the system.': 'Suivez chaque activité admin dans le système.',
  'Failed to load audit logs:': 'Échec du chargement des journaux d\'audit :',
  'Search by staff name, email or IP...': 'Rechercher par nom, e-mail ou IP du personnel...',
  'Action': 'Action',
  'IP Address': 'Adresse IP',
  'Time': 'Heure',
  'No audit logs found.': 'Aucun journal d\'audit trouvé.',

  // Settings
  'Company Information': 'Informations de l\'entreprise',
  'Company Name': 'Nom de l\'entreprise',
  'Contact Email': 'E-mail de contact',
  'Currency Code': 'Code de devise',
  'Default Rate (per kg)': 'Tarif par défaut (par kg)',
  'Headquarters Address': 'Adresse du siège',
  'Payment Methods': 'Modes de paiement',
  'e.g. Cash, Bank Transfer': 'ex. Espèces, Virement bancaire',
  'Saved!': 'Enregistré !',

  // Profile
  'Admin Profile': 'Profil admin',
  'Manage your profile and preferences.': 'Gérez votre profil et vos préférences.',
  'Enter current password': 'Saisissez le mot de passe actuel',
  'Enter new password': 'Saisissez le nouveau mot de passe',
  'Loading profile...': 'Chargement du profil...',
  'Profile not found.': 'Profil introuvable.',
  'Edit Profile': 'Modifier le profil',
  'Department': 'Département',
  'Change Password': 'Changer le mot de passe',
  'Current Password': 'Mot de passe actuel',
  'New Password': 'Nouveau mot de passe',
  'Update Password': 'Mettre à jour le mot de passe',
  'Login History': 'Historique de connexion',
  'No login history available.': 'Aucun historique de connexion disponible.',

  // Shipment detail
  'Back to Shipments': 'Retour aux expéditions',
  'Shipment not found.': 'Expédition introuvable.',
  'Shipment details and status tracking': 'Détails de l\'expédition et suivi du statut',
  'View Receipt': 'Voir le reçu',
  'Share': 'Partager',
  'WhatsApp': 'WhatsApp',
  'marked Delivered': 'marqué comme livré',
  'Shipment Timeline': 'Chronologie de l\'expédition',
  'Update Status': 'Mettre à jour le statut',
  'Shipment Details': 'Détails de l\'expédition',
  'Items': 'Articles',
  'Special Instructions': 'Instructions spéciales',
  'View Full Profile': 'Voir le profil complet',
  'Weight': 'Poids',
  'Rate': 'Tarif',
  'Method': 'Méthode',
  'Total': 'Total',
  'Internal Notes': 'Notes internes',
  'Add internal notes...': 'Ajouter des notes internes...',
  'No notes yet. Click to add.': 'Aucune note pour le moment. Cliquez pour ajouter.',
  'Save Notes': 'Enregistrer les notes',

  // Customer detail
  'Loading customer details...': 'Chargement des détails du client...',
  'Back to Customers': 'Retour aux clients',
  'Customer not found.': 'Client introuvable.',
  'Free Offer Progress': 'Progression de l\'offre gratuite',
  'kg to earn': 'kg pour gagner',
  'Spent': 'Dépensé',
  'No shipments found for this customer.': 'Aucune expédition trouvée pour ce client.',
  'Download PDF receipt': 'Télécharger le reçu PDF',
  'Send receipt via WhatsApp': 'Envoyer le reçu via WhatsApp',
};

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const initialLang: Lang =
  (typeof window !== 'undefined' ? (localStorage.getItem('lang') as Lang) : null) || 'en';

export const useLangStore = create<LangState>((set) => ({
  lang: initialLang,
  setLang: (lang) => {
    if (typeof window !== 'undefined') localStorage.setItem('lang', lang);
    set({ lang });
  },
  toggle: () => {
    const lang: Lang = useLangStore.getState().lang === 'en' ? 'fr' : 'en';
    if (typeof window !== 'undefined') localStorage.setItem('lang', lang);
    set({ lang });
  }
}));

export function t(key: string, lang?: Lang): string {
  const l = lang || (typeof window !== 'undefined' ? (localStorage.getItem('lang') as Lang) || 'en' : 'en');
  if (l === 'fr' && fr[key] !== undefined) return fr[key];
  return key;
}

export function useT() {
  const { lang } = useLangStore();
  return (key: string) => t(key, lang);
}
