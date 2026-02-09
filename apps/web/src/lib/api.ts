import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors - DEV MODE: disabled redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Disabled for development
    // if (error.response?.status === 401) {
    //   if (typeof window !== 'undefined') {
    //     localStorage.removeItem('token');
    //     window.location.href = '/login';
    //   }
    // }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/password', data),
};

// Users API
export const usersApi = {
  list: (params?: any) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  assignSites: (id: string, siteIds: string[]) =>
    api.put(`/users/${id}/sites`, { siteIds }),
};

// Sites API
export const sitesApi = {
  list: (params?: any) => api.get('/sites', { params }),
  get: (id: string) => api.get(`/sites/${id}`),
  create: (data: any) => api.post('/sites', data),
  update: (id: string, data: any) => api.put(`/sites/${id}`, data),
  delete: (id: string) => api.delete(`/sites/${id}`),
  testConnection: (id: string) => api.post(`/sites/${id}/test`),
  getCategories: (id: string) => api.get(`/sites/${id}/categories`),
  bulkImport: (sites: any[]) => api.post('/sites/bulk-import', { sites }),
  exportCsv: () => api.get('/sites/export/csv', { responseType: 'blob' }),
  // Groups
  listGroups: () => api.get('/sites/groups/list'),
  createGroup: (data: any) => api.post('/sites/groups', data),
  updateGroup: (id: string, data: any) => api.put(`/sites/groups/${id}`, data),
  deleteGroup: (id: string) => api.delete(`/sites/groups/${id}`),
};

// Articles API
export const articlesApi = {
  list: (params?: any) => api.get('/articles', { params }),
  get: (id: string) => api.get(`/articles/${id}`),
  create: (data: any) => api.post('/articles', data),
  update: (id: string, data: any) => api.put(`/articles/${id}`, data),
  delete: (id: string) => api.delete(`/articles/${id}`),
  generate: (id: string) => api.post(`/articles/${id}/generate`),
  regenerate: (id: string) => api.post(`/articles/${id}/regenerate`),
  generateImage: (id: string, options?: any) =>
    api.post(`/articles/${id}/generate-image`, options),
  publish: (id: string, status?: 'draft' | 'publish' | 'future', scheduledAt?: string) =>
    api.post(`/articles/${id}/publish`, { status, scheduledAt }),
  retry: (id: string) => api.post(`/articles/${id}/retry`),
  bulkGenerate: (data: any) => api.post('/articles/bulk-generate', data),
};

// API Keys API
export const apiKeysApi = {
  list: () => api.get('/api-keys'),
  get: (id: string) => api.get(`/api-keys/${id}`),
  create: (data: any) => api.post('/api-keys', data),
  update: (id: string, data: any) => api.put(`/api-keys/${id}`, data),
  delete: (id: string) => api.delete(`/api-keys/${id}`),
  test: (id: string) => api.post(`/api-keys/${id}/test`),
  setDefault: (id: string) => api.post(`/api-keys/${id}/set-default`),
};

// Settings API
export const settingsApi = {
  getCleanup: () => api.get('/settings/cleanup'),
  updateCleanup: (data: {
    cleanupEnabled: boolean;
    cleanupRetentionDays: number;
    activityLogRetentionDays: number;
  }) => api.put('/settings/cleanup', data),
  runCleanupNow: () => api.post('/settings/cleanup/run'),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
  getPostsReport: (period?: string) =>
    api.get('/reports/posts', { params: { period } }),
  getErrorsReport: () => api.get('/reports/errors'),
  getApiUsageReport: () => api.get('/reports/api-usage'),
};
