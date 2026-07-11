'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import { useCallback } from 'react';
import { api } from './api';
import { useUiStore } from './store';

const fetcher = (key: [string, ...any[]]) => {
  const [path, ...args] = key;
  switch (path) {
    case 'staff': return api.getStaff();
    case 'staff/member': return api.getStaffMember(args[0]);
    case 'customers': return api.getCustomers();
    case 'customer': return api.getCustomer(args[0]);
    case 'shipments': return api.getShipments(args[0]);
    case 'shipment': return api.getShipment(args[0]);
    case 'categories': return api.getCategories();
    case 'offers': return api.getOffers();
    case 'settings': return api.getSettings();
    case 'notifications': return api.getNotifications(args[0]);
    case 'notifications/unread': return api.getUnreadCount();
    case 'audit': return api.getAuditLogs(args[0]);
    case 'shipping-items': return api.getShippingItems();
    case 'config': return api.getConfig();
    case 'work-sessions': return api.getWorkSessions();
    default: return Promise.resolve(undefined);
  }
};

export type { Customer, Staff, Shipment, Category, Offer, Settings, ShipmentStatus, Route, ShippingItem, ShipmentLineItem, Expense } from './store';

let configCache: Record<string, any> | null = null;

export function useAppConfig() {
  const { data, error, isLoading } = useSWR('config', () => api.getConfig(), {
    revalidateOnFocus: false,
    refreshInterval: 0, // rarely changes — no need to poll
  });
  return { config: data ?? configCache ?? null, loading: isLoading, error };
}

export function useStaff() {
  const { data, error, isLoading, mutate } = useSWR('staff', () => api.getStaff());
  const staff = data ?? [];

  const inviteStaff = useCallback(async (data: { email: string; role: 'Admin' | 'Staff' }) => {
    const created = await api.inviteStaff(data);
    mutate((prev) => [created, ...(prev ?? [])], false);
    return created;
  }, [mutate]);

  const resendStaffInvite = useCallback(async (id: string) => api.resendStaffInvite(id), []);
  const completeStaffProfile = useCallback(async (id: string, data: any) => {
    const updated = await api.completeStaffProfile(id, data);
    mutate((prev) => (prev ?? []).map((s: any) => (s.id === id ? updated : s)), false);
    return updated;
  }, [mutate]);
  const updateStaff = useCallback(async (id: string, data: any) => {
    const updated = await api.updateStaff(id, data);
    mutate((prev) => (prev ?? []).map((s: any) => (s.id === id ? updated : s)), false);
    return updated;
  }, [mutate]);
  const deleteStaff = useCallback(async (id: string) => {
    await api.deleteStaff(id);
    mutate((prev) => (prev ?? []).filter((s: any) => s.id !== id), false);
  }, [mutate]);
  const toggleStaffActive = useCallback(async (id: string, active: boolean) => {
    const updated = await api.toggleStaffActive(id, active);
    mutate((prev) => (prev ?? []).map((s: any) => (s.id === id ? updated : s)), false);
    return updated;
  }, [mutate]);

  return { staff, loading: isLoading, error: error?.message, reload: () => mutate(), inviteStaff, resendStaffInvite, completeStaffProfile, updateStaff, deleteStaff, toggleStaffActive };
}

export function useWorkSessions() {
  const { data, error, isLoading, mutate } = useSWR('work-sessions', () => api.getWorkSessions());
  const sessions = data ?? [];
  return { sessions, loading: isLoading, error: error?.message, reload: () => mutate(), mutate };
}

// The current staff member's own work-session state — drives the topbar
// Start/End Work toggle. Every mutating API route requires this session to be
// open before it will accept a create/edit/delete.
export function useWorkSession() {
  const { activeStaffEmail } = useUiStore();
  const { sessions, loading, error, mutate } = useWorkSessions();
  const mySession = sessions.find((s: any) => s.staffEmail === activeStaffEmail && !s.endedAt) ?? null;

  // Write the server's response straight into the SWR cache (same pattern as
  // every other hook here, e.g. useStaff's inviteStaff) instead of triggering
  // a second round-trip revalidation fetch — the button updates instantly.
  const startWork = useCallback(async () => {
    const created = await api.startWorkSession();
    mutate((prev: any[] = []) => [created, ...prev], false);
    return created;
  }, [mutate]);

  const endWork = useCallback(async () => {
    const ended = await api.endWorkSession();
    mutate((prev: any[] = []) => prev.map((s) => (s.id === ended.id ? ended : s)), false);
    return ended;
  }, [mutate]);

  return { session: mySession, loading, error, startWork, endWork };
}

export function useCustomers() {
  const { data, error, isLoading, mutate } = useSWR('customers', () => api.getCustomers());
  const customers = data ?? [];

  const addCustomer = useCallback(async (data: any) => {
    const created = await api.createCustomer(data);
    mutate((prev) => [created, ...(prev ?? [])], false);
    return created;
  }, [mutate]);
  const updateCustomer = useCallback(async (id: string, data: any) => {
    const updated = await api.updateCustomer(id, data);
    mutate((prev) => (prev ?? []).map((c: any) => (c.id === id ? updated : c)), false);
    return updated;
  }, [mutate]);
  const toggleCustomerActive = useCallback(async (id: string, active: boolean) => {
    const updated = await api.toggleCustomerActive(id, active);
    mutate((prev) => (prev ?? []).map((c: any) => (c.id === id ? updated : c)), false);
    return updated;
  }, [mutate]);

  return { customers, loading: isLoading, error: error?.message, reload: () => mutate(), addCustomer, updateCustomer, toggleCustomerActive };
}

export function useShipments() {
  const { data, error, isLoading, mutate } = useSWR('shipments', () => api.getShipments());
  const shipments = data ?? [];

  const addShipment = useCallback(async (data: any) => {
    const created = await api.createShipment(data);
    mutate((prev) => [created, ...(prev ?? [])], false);
    return created;
  }, [mutate]);
  const updateShipment = useCallback(async (id: string, data: any) => {
    const updated = await api.updateShipment(id, data);
    mutate((prev) => (prev ?? []).map((s: any) => (s.id === id ? updated : s)), false);
    return updated;
  }, [mutate]);
  const updateShipmentStatus = useCallback(async (id: string, status: string) => {
    const updated = await api.updateShipmentStatus(id, status);
    mutate((prev) => (prev ?? []).map((s: any) => (s.id === id ? updated : s)), false);
    return updated;
  }, [mutate]);
  const deleteShipment = useCallback(async (id: string) => {
    await api.deleteShipment(id);
    mutate((prev) => (prev ?? []).filter((s: any) => s.id !== id), false);
  }, [mutate]);

  return { shipments, loading: isLoading, error: error?.message, reload: () => mutate(), addShipment, updateShipment, updateShipmentStatus, deleteShipment };
}

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR('categories', () => api.getCategories());
  const categories = data ?? [];

  const addCategory = useCallback(async (data: any) => {
    const created = await api.createCategory(data);
    mutate((prev) => [created, ...(prev ?? [])], false);
    return created;
  }, [mutate]);
  const updateCategory = useCallback(async (id: string, data: any) => {
    const updated = await api.updateCategory(id, data);
    mutate((prev) => (prev ?? []).map((c: any) => (c.id === id ? updated : c)), false);
    return updated;
  }, [mutate]);
  const deleteCategory = useCallback(async (id: string) => {
    await api.deleteCategory(id);
    mutate((prev) => (prev ?? []).filter((c: any) => c.id !== id), false);
  }, [mutate]);

  return { categories, loading: isLoading, error: error?.message, reload: () => mutate(), addCategory, updateCategory, deleteCategory };
}

export function useOffers() {
  const { data, error, isLoading, mutate } = useSWR('offers', () => api.getOffers());
  const offers = data ?? [];

  const addOffer = useCallback(async (data: any) => {
    const created = await api.createOffer(data);
    mutate((prev) => [created, ...(prev ?? [])], false);
    return created;
  }, [mutate]);
  const updateOffer = useCallback(async (id: string, data: any) => {
    const updated = await api.updateOffer(id, data);
    mutate((prev) => (prev ?? []).map((o: any) => (o.id === id ? updated : o)), false);
    return updated;
  }, [mutate]);
  const deleteOffer = useCallback(async (id: string) => {
    await api.deleteOffer(id);
    mutate((prev) => (prev ?? []).filter((o: any) => o.id !== id), false);
  }, [mutate]);

  return { offers, loading: isLoading, error: error?.message, reload: () => mutate(), addOffer, updateOffer, deleteOffer };
}

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR('settings', () => api.getSettings(), { revalidateOnFocus: false });
  const updateSettings = useCallback(async (data: any) => {
    const updated = await api.updateSettings(data);
    mutate(updated, false);
    return updated;
  }, [mutate]);
  return { settings: data ?? null, loading: isLoading, error: error?.message, reload: () => mutate(), updateSettings };
}

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR('notifications', () => api.getNotifications({ limit: 100 }));
  const { data: countData } = useSWR('notifications/unread', () => api.getUnreadCount(), { revalidateOnFocus: false });
  const notifications = data ?? [];
  const unreadCount = countData?.count ?? 0;

  const createNotification = useCallback(async (data: any) => {
    const created = await api.createNotification(data);
    mutate((prev) => [created, ...(prev ?? [])], false);
    globalMutate('notifications/unread');
    return created;
  }, [mutate]);
  const updateNotification = useCallback(async (id: string, data: any) => {
    const updated = await api.updateNotification(id, data);
    mutate((prev) => (prev ?? []).map((n: any) => (n.id === id ? updated : n)), false);
    return updated;
  }, [mutate]);
  const markAllRead = useCallback(async (staffId?: string) => {
    await api.markAllNotificationsRead(staffId || '');
    mutate((prev) => (prev ?? []).map((n: any) => ({ ...n, read: true })), false);
    globalMutate('notifications/unread', { count: 0 }, false);
  }, [mutate]);
  const deleteNotification = useCallback(async (id: string) => {
    await api.deleteNotification(id);
    mutate((prev) => (prev ?? []).filter((n: any) => n.id !== id), false);
    globalMutate('notifications/unread');
  }, [mutate]);

  return { notifications, loading: isLoading, error: error?.message, unreadCount, reload: () => mutate(), createNotification, updateNotification, markAllRead, deleteNotification };
}

export function useAuditLogs() {
  const { data, error, isLoading, mutate } = useSWR('audit', () => api.getAuditLogs({ limit: 200 }));
  const logs = data ?? [];
  const createAuditLog = useCallback(async (data: any) => {
    const created = await api.createAuditLog(data);
    mutate((prev) => [created, ...(prev ?? [])], false);
    return created;
  }, [mutate]);
  return { logs, loading: isLoading, error: error?.message, reload: () => mutate(), createAuditLog };
}

export function useExpenses() {
  const { data, error, isLoading, mutate } = useSWR('expenses', () => api.getExpenses());
  const expenses = data ?? [];

  const addExpense = useCallback(async (data: any) => {
    const created = await api.createExpense(data);
    mutate((prev) => [created, ...(prev ?? [])], false);
    return created;
  }, [mutate]);
  const updateExpense = useCallback(async (id: string, data: any) => {
    const updated = await api.updateExpense(id, data);
    mutate((prev) => (prev ?? []).map((e: any) => (e.id === id ? updated : e)), false);
    return updated;
  }, [mutate]);
  const deleteExpense = useCallback(async (id: string) => {
    await api.deleteExpense(id);
    mutate((prev) => (prev ?? []).filter((e: any) => e.id !== id), false);
  }, [mutate]);

  return { expenses, loading: isLoading, error: error?.message, reload: () => mutate(), addExpense, updateExpense, deleteExpense };
}

export function useRoutes() {
  const { data, error, isLoading, mutate } = useSWR('settings-routes', async () => {
    const s = await api.getSettings();
    return s.routes || [];
  }, { revalidateOnFocus: false });
  return { routes: data ?? [], loading: isLoading, error: error?.message, reload: () => mutate() };
}

export function useShippingItems() {
  const { data, error, isLoading, mutate } = useSWR('shipping-items', () => api.getShippingItems());
  const items = data ?? [];

  const addItem = useCallback(async (data: any) => {
    const created = await api.createShippingItem(data);
    mutate((prev) => [created, ...(prev ?? [])], false);
    return created;
  }, [mutate]);
  const updateItem = useCallback(async (id: string, data: any) => {
    const updated = await api.updateShippingItem(id, data);
    mutate((prev) => (prev ?? []).map((i: any) => (i.id === id ? updated : i)), false);
    return updated;
  }, [mutate]);
  const deleteItem = useCallback(async (id: string) => {
    await api.deleteShippingItem(id);
    mutate((prev) => (prev ?? []).filter((i: any) => i.id !== id), false);
  }, [mutate]);

  return { shippingItems: items, loading: isLoading, error: error?.message, reload: () => mutate(), addItem, updateItem, deleteItem };
}
