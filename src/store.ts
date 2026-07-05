import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ShipmentStatus =
'Pending' |
'Packed' |
'In Transit' |
'Delivered' |
'Cancelled';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalKgSent: number;
  notes: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  customerId: string;
  origin: string;
  destination: string;
  category: string;
  weightKg: number;
  quantity: number;
  description: string;
  status: ShipmentStatus;
  date: string;
  paymentStatus: 'Paid' | 'Unpaid';
  paymentMethod: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  handlingNotes: string;
}

export interface Offer {
  id: string;
  name: string;
  targetKg: number;
  rewardKg: number;
  active: boolean;
}

export interface Route {
  id: string;
  from: string;
  to: string;
  active: boolean;
}

export interface Settings {
  companyName: string;
  contactEmail: string;
  phone: string;
  address: string;
  currency: string;
  defaultRatePerKg: number;
  routes: Route[];
  paymentMethods: string[];
}

interface AppState {
  customers: Customer[];
  shipments: Shipment[];
  categories: Category[];
  offers: Offer[];
  settings: Settings;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  addShipment: (shipment: Shipment) => void;
  updateShipmentStatus: (id: string, status: ShipmentStatus) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addOffer: (offer: Offer) => void;
  updateOffer: (offer: Offer) => void;
  deleteOffer: (id: string) => void;
  updateSettings: (settings: Settings) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      customers: [
      {
        id: '1',
        name: 'Jean Dupont',
        phone: '+261 34 00 000 00',
        email: 'jean@example.com',
        address: 'Antananarivo, Madagascar',
        totalKgSent: 45,
        notes: 'VIP Customer'
      },
      {
        id: '2',
        name: 'Marie Claire',
        phone: '+230 5000 0000',
        email: 'marie@example.com',
        address: 'Port Louis, Mauritius',
        totalKgSent: 12,
        notes: ''
      }],

      shipments: [
      {
        id: '1',
        trackingNumber: 'TRK-1001',
        customerId: '1',
        origin: 'Madagascar',
        destination: 'Mauritius',
        category: 'Spices & Vanilla',
        weightKg: 15,
        quantity: 2,
        description: 'Premium Vanilla Beans',
        status: 'In Transit',
        date: '2026-07-01',
        paymentStatus: 'Paid',
        paymentMethod: 'Cash'
      },
      {
        id: '2',
        trackingNumber: 'TRK-1002',
        customerId: '2',
        origin: 'Mauritius',
        destination: 'Madagascar',
        category: 'Textiles',
        weightKg: 8,
        quantity: 1,
        description: 'Cotton fabrics',
        status: 'Pending',
        date: '2026-07-04',
        paymentStatus: 'Unpaid',
        paymentMethod: 'Mobile Money (Mvola)'
      }],

      categories: [
      {
        id: '1',
        name: 'Spices & Vanilla',
        description: 'Agricultural products',
        handlingNotes: 'Keep dry, moderate temperature'
      },
      {
        id: '2',
        name: 'Textiles',
        description: 'Clothing and fabrics',
        handlingNotes: 'Standard handling'
      },
      {
        id: '3',
        name: 'Electronics',
        description: 'Devices and components',
        handlingNotes: 'Fragile, keep dry'
      }],

      offers: [
      {
        id: '1',
        name: 'Send 25kg, Get 2kg Free',
        targetKg: 25,
        rewardKg: 2,
        active: true
      }],

      settings: {
        companyName: 'La Grande Marque',
        contactEmail: 'contact@lagrandemarque.com',
        phone: '+261 34 00 000 00',
        address: 'Antananarivo, Madagascar',
        currency: 'MGA',
        defaultRatePerKg: 15000,
        routes: [
        { id: '1', from: 'Madagascar', to: 'Mauritius', active: true }],

        paymentMethods: ['Cash', 'Bank Transfer', 'Mobile Money (Mvola)']
      },
      addCustomer: (customer) =>
      set((state) => ({ customers: [...state.customers, customer] })),
      updateCustomer: (customer) =>
      set((state) => ({
        customers: state.customers.map((c) =>
        c.id === customer.id ? customer : c
        )
      })),
      deleteCustomer: (id) =>
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id)
      })),
      addShipment: (shipment) =>
      set((state) => {
        const updatedCustomers = state.customers.map((c) =>
        c.id === shipment.customerId ?
        { ...c, totalKgSent: c.totalKgSent + shipment.weightKg } :
        c
        );
        return {
          shipments: [shipment, ...state.shipments],
          customers: updatedCustomers
        };
      }),
      updateShipmentStatus: (id, status) =>
      set((state) => ({
        shipments: state.shipments.map((s) =>
        s.id === id ? { ...s, status } : s
        )
      })),
      addCategory: (category) =>
      set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (category) =>
      set((state) => ({
        categories: state.categories.map((c) =>
        c.id === category.id ? category : c
        )
      })),
      deleteCategory: (id) =>
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id)
      })),
      addOffer: (offer) =>
      set((state) => ({ offers: [...state.offers, offer] })),
      updateOffer: (offer) =>
      set((state) => ({
        offers: state.offers.map((o) => o.id === offer.id ? offer : o)
      })),
      deleteOffer: (id) =>
      set((state) => ({
        offers: state.offers.filter((o) => o.id !== id)
      })),
      updateSettings: (settings) => set(() => ({ settings }))
    }),
    {
      name: 'shipping-admin-storage',
      version: 2
    }
  )
);

export function genId() {
  return Math.random().toString(36).substring(2, 9);
}