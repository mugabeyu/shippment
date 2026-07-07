import { create } from 'zustand';

export type ShipmentStatus = 'Pending' | 'Packed' | 'Ready' | 'Loaded' | 'In Transit' | 'Arrived' | 'Ready for Pickup' | 'Delivered' | 'Cancelled';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  alternative_address?: string;
  totalKgSent: number;
  notes: string;
  photo: string;
  registration_date?: string;
  last_shipment_date?: string;
  active: boolean;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
  phone: string;
  photo: string;
  active: boolean;
  department?: string;
  last_login?: string;
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
  receiptSent: boolean;
  pickupDate?: string;
  expectedArrival?: string;
  insurance?: boolean;
  specialInstructions?: string;
  internalNotes?: string;
  photos?: string[];
  basePrice?: number;
  discountAmount?: number;
  finalAmount?: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  handlingNotes: string;
  icon?: string;
  pricePerKg?: number;
}

export interface Offer {
  id: string;
  name: string;
  targetKg: number;
  rewardKg: number;
  discountPercent: number;
  discountAmount: number;
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
  loyaltyEnabled?: boolean;
  taxEnabled?: boolean;
  taxRate?: number;
}

export interface Notification {
  id: string;
  type: 'shipment_delivered' | 'customer_registered' | 'payment_received' | 'reward_issued' | 'admin_login' | 'shipment_cancelled' | 'system';
  title: string;
  message: string;
  read: boolean;
  staffId?: string;
  referenceId?: string;
  referenceType?: string;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: Record<string, any>;
  staffId?: string;
  staffName?: string;
  staffEmail?: string;
  ipAddress?: string;
  createdAt?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  shipmentId: string;
  customerId: string;
  staffId?: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  pdfUrl?: string;
  sentViaWhatsapp: boolean;
  createdAt?: string;
}

interface UiState {
  sidebarOpen: boolean;
  activeStaffName: string;
  activeStaffEmail: string;
  activeStaffPhoto: string;
  activeStaffRole: string;
  setSidebarOpen: (open: boolean) => void;
  setActiveStaff: (name: string, email: string, role: string, photo?: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  activeStaffName: typeof window !== 'undefined' ? (localStorage.getItem('activeStaffName') || '') : '',
  activeStaffEmail: typeof window !== 'undefined' ? (localStorage.getItem('activeStaffEmail') || '') : '',
  activeStaffPhoto: typeof window !== 'undefined' ? (localStorage.getItem('activeStaffPhoto') || '') : '',
  activeStaffRole: typeof window !== 'undefined' ? (localStorage.getItem('activeStaffRole') || '') : '',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveStaff: (name, email, role, photo) => {
    if (photo !== undefined) {
      localStorage.setItem('activeStaffPhoto', photo);
    }
    localStorage.setItem('activeStaffName', name);
    localStorage.setItem('activeStaffEmail', email);
    localStorage.setItem('activeStaffRole', role);
    set({
      activeStaffName: name,
      activeStaffEmail: email,
      activeStaffRole: role,
      ...(photo !== undefined ? { activeStaffPhoto: photo } : {})
    });
  }
}));

export function genId() {
  return Math.random().toString(36).substring(2, 9);
}

export function genReceiptNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const r = Math.floor(1000 + Math.random() * 9000);
  return `RCP-${y}${m}${d}-${r}`;
}
