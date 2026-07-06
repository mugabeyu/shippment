import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Customer, Staff, Shipment, Category, Offer, Settings, ShipmentStatus, Route, Notification, AuditLog, Receipt } from '../store';

let configCache: Record<string, any> | null = null;
let configPromise: Promise<Record<string, any>> | null = null;

async function fetchAppConfig(): Promise<Record<string, any>> {
  if (configCache) return configCache;
  if (configPromise) return configPromise;
  configPromise = api.getConfig();
  configCache = await configPromise;
  return configCache;
}

export function useAppConfig() {
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppConfig()
      .then(setConfig)
      .catch(() => setConfig({}))
      .finally(() => setLoading(false));
  }, []);

  return { config, loading };
}

export type { Customer, Staff, Shipment, Category, Offer, Settings, ShipmentStatus, Route };

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStaff();
      setStaff(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const inviteStaff = async (data: { email: string; role: 'Admin' | 'Staff' }) => {
    const created = await api.inviteStaff(data);
    setStaff((prev) => [created, ...prev]);
    return created;
  };

  const resendStaffInvite = async (id: string) => {
    const result = await api.resendStaffInvite(id);
    return result;
  };

  const completeStaffProfile = async (id: string, data: { name: string; phone: string; photo: string }) => {
    const updated = await api.completeStaffProfile(id, data);
    setStaff((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const updateStaff = async (id: string, data: Partial<Staff>) => {
    const updated = await api.updateStaff(id, data);
    setStaff((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const deleteStaff = async (id: string) => {
    await api.deleteStaff(id);
    setStaff((prev) => prev.filter((s) => s.id !== id));
  };

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  return { staff, loading, error, reload: loadStaff, inviteStaff, resendStaffInvite, completeStaffProfile, updateStaff, deleteStaff };
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCustomer = async (data: Omit<Customer, 'id'>) => {
    const created = await api.createCustomer(data);
    setCustomers((prev) => [created, ...prev]);
    return created;
  };

  const updateCustomer = async (id: string, data: Partial<Customer>) => {
    const updated = await api.updateCustomer(id, data);
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCustomer = async (id: string) => {
    await api.deleteCustomer(id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return { customers, loading, error, reload: loadCustomers, addCustomer, updateCustomer, deleteCustomer };
}

export function useShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadShipments = useCallback(async (params?: { status?: string; customerId?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getShipments(params);
      setShipments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addShipment = async (data: Omit<Shipment, 'id'>) => {
    const created = await api.createShipment(data);
    setShipments((prev) => [created, ...prev]);
    return created;
  };

  const updateShipment = async (id: string, data: Partial<Shipment>) => {
    const updated = await api.updateShipment(id, data);
    setShipments((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const updateShipmentStatus = async (id: string, status: ShipmentStatus) => {
    const updated = await api.updateShipmentStatus(id, status);
    setShipments((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const deleteShipment = async (id: string) => {
    await api.deleteShipment(id);
    setShipments((prev) => prev.filter((s) => s.id !== id));
  };

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  return { shipments, loading, error, reload: loadShipments, addShipment, updateShipment, updateShipmentStatus, deleteShipment };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = async (data: Omit<Category, 'id'>) => {
    const created = await api.createCategory(data);
    setCategories((prev) => [created, ...prev]);
    return created;
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    const updated = await api.updateCategory(id, data);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCategory = async (id: string) => {
    await api.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return { categories, loading, error, reload: loadCategories, addCategory, updateCategory, deleteCategory };
}

export function useOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getOffers();
      setOffers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addOffer = async (data: Omit<Offer, 'id'>) => {
    const created = await api.createOffer(data);
    setOffers((prev) => [created, ...prev]);
    return created;
  };

  const updateOffer = async (id: string, data: Partial<Offer>) => {
    const updated = await api.updateOffer(id, data);
    setOffers((prev) => prev.map((o) => (o.id === id ? updated : o)));
    return updated;
  };

  const deleteOffer = async (id: string) => {
    await api.deleteOffer(id);
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  return { offers, loading, error, reload: loadOffers, addOffer, updateOffer, deleteOffer };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSettings();
      setSettings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = async (data: Partial<Settings>) => {
    const updated = await api.updateSettings({ ...settings, ...data });
    setSettings(updated);
    return updated;
  };

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return { settings, loading, error, reload: loadSettings, updateSettings };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, countRes] = await Promise.all([
        api.getNotifications({ limit: 100 }),
        api.getUnreadCount()
      ]);
      setNotifications(data);
      setUnreadCount(countRes.count);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNotification = async (data: any) => {
    const created = await api.createNotification(data);
    setNotifications((prev) => [created, ...prev]);
    if (!created.read) setUnreadCount((c) => c + 1);
    return created;
  };

  const updateNotification = async (id: string, data: any) => {
    const updated = await api.updateNotification(id, data);
    setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    if (updated.read) setUnreadCount((c) => Math.max(0, c - 1));
    return updated;
  };

  const markAllRead = async (staffId?: string) => {
    await api.markAllNotificationsRead(staffId || '');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (id: string) => {
    await api.deleteNotification(id);
    setNotifications((prev) => {
      const n = prev.find((n) => n.id === id);
      if (n && !n.read) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.filter((n) => n.id !== id);
    });
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  return { notifications, loading, error, unreadCount, reload: loadNotifications, createNotification, updateNotification, markAllRead, deleteNotification };
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAuditLogs({ limit: 200 });
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAuditLog = async (data: any) => {
    const created = await api.createAuditLog(data);
    setLogs((prev) => [created, ...prev]);
    return created;
  };

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  return { logs, loading, error, reload: loadAuditLogs, createAuditLog };
}

export function useReceipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReceipts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getReceipts({ limit: 200 });
      setReceipts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createReceipt = async (data: any) => {
    const created = await api.createReceipt(data);
    setReceipts((prev) => [created, ...prev]);
    return created;
  };

  const updateReceipt = async (id: string, data: any) => {
    const updated = await api.updateReceipt(id, data);
    setReceipts((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  };

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  return { receipts, loading, error, reload: loadReceipts, createReceipt, updateReceipt };
}

export function useRoutes() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoutes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSettings();
      setRoutes(data.routes || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  return { routes, loading, error, reload: loadRoutes };
}

export function genId() {
  return Math.random().toString(36).substring(2, 9);
}
