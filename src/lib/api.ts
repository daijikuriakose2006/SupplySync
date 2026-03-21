import axios from 'axios';

const API_BASE = 'https://supplysync-ts7y.onrender.com/api';

const api = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string; role: string }) =>
    api.post('/auth/login', data),
  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
  me: () => api.get('/auth/me'),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get('/users'),
  create: (data: { name: string; email: string; password: string }) =>
    api.post('/users', data),
  update: (id: string, data: object) => api.put(`/users/${id}`, data),
  remove: (id: string) => api.delete(`/users/${id}`),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params?: object) => api.get('/products', { params }),
  categories: () => api.get('/products/categories'),
  get: (id: string) => api.get(`/products/${id}`),
  create: (data: object) => api.post('/products', data),
  update: (id: string, data: object) => api.put(`/products/${id}`, data),
  remove: (id: string) => api.delete(`/products/${id}`),
};

// ─── Barcode ──────────────────────────────────────────────────────────────────
export const barcodeApi = {
  lookup: (code: string) => api.get(`/barcode/${encodeURIComponent(code)}`),
  scan: (data: { barcode: string; addStock?: number }) => api.post('/barcode/scan', data),
};

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const suppliersApi = {
  list: () => api.get('/suppliers'),
  create: (data: object) => api.post('/suppliers', data),
  update: (id: string, data: object) => api.put(`/suppliers/${id}`, data),
  remove: (id: string) => api.delete(`/suppliers/${id}`),
  scanBill: (barcodes: string[]) => api.post('/suppliers/scan-bill', { barcodes }),
};

// ─── Sales ────────────────────────────────────────────────────────────────────
export interface SaleItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  price: number;
}

export const salesApi = {
  record: (items: SaleItem[]) => api.post('/sales', { items }),
  list: (params?: { date?: string; from?: string; to?: string }) =>
    api.get('/sales', { params }),
  today: () => api.get('/sales/today'),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  salesTrends: (period?: string) => api.get('/dashboard/sales-trends', { params: { period } }),
  categoryDistribution: () => api.get('/dashboard/category-distribution'),
};

// ─── Forecast ─────────────────────────────────────────────────────────────────
export const forecastApi = {
  all: () => api.get('/forecast'),
  product: (id: string) => api.get(`/forecast/${id}`),
};

// ─── Recommendations ──────────────────────────────────────────────────────────
export const recommendationsApi = {
  list: () => api.get('/recommendations'),
};

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alertsApi = {
  list: () => api.get('/alerts'),
  check: () => api.post('/alerts/check'),
  markRead: (id: string) => api.put(`/alerts/${id}/read`),
  markAllRead: () => api.put('/alerts/read-all'),
};

// ─── GST ──────────────────────────────────────────────────────────────────────
export const gstApi = {
  list: () => api.get('/gst'),
  save: (data: { category: string; percentage: number }) => api.post('/gst', data),
  remove: (category: string) => api.delete(`/gst/${encodeURIComponent(category)}`),
};

// ─── Bill Charges ─────────────────────────────────────────────────────────────
export const billChargesApi = {
  list: () => api.get('/bill-charges'),
  create: (data: { name: string; percentage: number }) => api.post('/bill-charges', data),
  update: (id: string, percentage: number) => api.put(`/bill-charges/${id}`, { percentage }),
  remove: (id: string) => api.delete(`/bill-charges/${id}`),
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (shopName: string) => api.put('/settings', { shopName }),
};
