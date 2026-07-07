const API_BASE = '/api';

function toCamelCase(str: string): string {
  return str.replace(/[_-]+([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** Recursively converts object keys from snake_case to camelCase. */
function camelizeKeys(value: any): any {
  if (Array.isArray(value)) return value.map(camelizeKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [toCamelCase(k), camelizeKeys(v)])
    );
  }
  return value;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return camelizeKeys(await response.json());
}

export const api = {
  // Staff
  getStaff: () => request<any[]>('/staff'),
  getStaffMember: (id: string) => request<any>(`/staff/${id}`),
  inviteStaff: (data: { email: string; role: 'Admin' | 'Staff' }) => request<any>('/staff', { method: 'POST', body: JSON.stringify(data) }),
  resendStaffInvite: (id: string) => request<any>(`/staff/${id}/resend-invite`, { method: 'POST' }),
  completeStaffProfile: (id: string, data: any) => request<any>(`/staff/${id}/complete-profile`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateStaff: (id: string, data: any) => request<any>(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStaff: (id: string) => request<any>(`/staff/${id}`, { method: 'DELETE' }),
  toggleStaffActive: (id: string, active: boolean) => request<any>(`/staff/${id}`, { method: 'PUT', body: JSON.stringify({ active }) }),
  registerStaff: (id: string, data: { password: string; name: string; phone: string; photo?: string }) => request<any>(`/staff/${id}/register`, { method: 'POST', body: JSON.stringify(data) }),

  // Customers
  getCustomers: () => request<any[]>('/customers'),
  getCustomer: (id: string) => request<any>(`/customers/${id}`),
  createCustomer: (data: any) => request<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: any) => request<any>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleCustomerActive: (id: string, active: boolean) => request<any>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify({ active }) }),

  // Shipments
  getShipments: (params?: { status?: string; customerId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.customerId) qs.set('customerId', params.customerId);
    const q = qs.toString();
    return request<any[]>(`/shipments${q ? `?${q}` : ''}`);
  },
  getShipment: (id: string) => request<any>(`/shipments/${id}`),
  createShipment: (data: any) => request<any>('/shipments', { method: 'POST', body: JSON.stringify(data) }),
  updateShipment: (id: string, data: any) => request<any>(`/shipments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateShipmentStatus: (id: string, status: string) =>
    request<any>(`/shipments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteShipment: (id: string) => request<any>(`/shipments/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request<any[]>('/categories'),
  getCategory: (id: string) => request<any>(`/categories/${id}`),
  createCategory: (data: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request<any>(`/categories/${id}`, { method: 'DELETE' }),

  // Offers
  getOffers: () => request<any[]>('/offers'),
  getOffer: (id: string) => request<any>(`/offers/${id}`),
  createOffer: (data: any) => request<any>('/offers', { method: 'POST', body: JSON.stringify(data) }),
  updateOffer: (id: string, data: any) => request<any>(`/offers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOffer: (id: string) => request<any>(`/offers/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request<any>('/settings'),
  updateSettings: (data: any) => request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: (params?: { read?: boolean; staffId?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.read !== undefined) qs.set('read', String(params.read));
    if (params?.staffId) qs.set('staffId', params.staffId);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const q = qs.toString();
    return request<any[]>(`/notifications${q ? `?${q}` : ''}`);
  },
  getUnreadCount: () => request<{ count: number }>('/notifications/unread-count'),
  getNotification: (id: string) => request<any>(`/notifications/${id}`),
  createNotification: (data: any) => request<any>('/notifications', { method: 'POST', body: JSON.stringify(data) }),
  updateNotification: (id: string, data: any) => request<any>(`/notifications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  markAllNotificationsRead: (staffId: string) => request<any>('/notifications/mark-all-read', { method: 'PATCH', body: JSON.stringify({ staffId }) }),
  deleteNotification: (id: string) => request<any>(`/notifications/${id}`, { method: 'DELETE' }),

  // Audit Logs
  getAuditLogs: (params?: { action?: string; staffId?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.action) qs.set('action', params.action);
    if (params?.staffId) qs.set('staffId', params.staffId);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const q = qs.toString();
    return request<any[]>(`/audit${q ? `?${q}` : ''}`);
  },
  getAuditLog: (id: string) => request<any>(`/audit/${id}`),
  createAuditLog: (data: any) => request<any>('/audit', { method: 'POST', body: JSON.stringify(data) }),

  // Expenses
  getExpenses: () => request<any[]>('/expenses'),
  getExpense: (id: string) => request<any>(`/expenses/${id}`),
  createExpense: (data: any) => request<any>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id: string, data: any) => request<any>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id: string) => request<any>(`/expenses/${id}`, { method: 'DELETE' }),

  // Config
  getConfig: () => request<Record<string, any>>('/config'),
  getConfigKey: (key: string) => request<{ key: string; value: any }>(`/config/${encodeURIComponent(key)}`),
};

  // Config
