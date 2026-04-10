import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Axios instance ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401: clear auth and redirect to /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tt_token');
      localStorage.removeItem('tt_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authAPI = {
  registerAdmin: (data) => api.post('/auth/register-admin', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Admin Management API ────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getPendingAdmins: () => api.get('/admin/pending'),
  getActiveAdmins: () => api.get('/admin/active-admins'),
  getDisabledAdmins: () => api.get('/admin/disabled-admins'),
  approveAdmin: (id, data) => api.put(`/admin/approve/${id}`, data),
  rejectAdmin: (id) => api.delete(`/admin/reject/${id}`),
  toggleAdminStatus: (id) => api.put(`/admin/toggle/${id}`),
  deleteAdmin: (id) => api.delete(`/admin/delete-admin/${id}`),
};

// ─── Department API ──────────────────────────────────────────────────────────
export const departmentAPI = {
  getAll: (params) => api.get('/departments', { params }),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// ─── Building API ────────────────────────────────────────────────────────────
export const buildingAPI = {
  getAll: (params) => api.get('/buildings', { params }),
  create: (data) => api.post('/buildings', data),
  update: (id, data) => api.put(`/buildings/${id}`, data),
  delete: (id) => api.delete(`/buildings/${id}`),
};

// ─── Room API ────────────────────────────────────────────────────────────────
export const roomAPI = {
  getAll: (params) => api.get('/rooms', { params }),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
};

// ─── Timetable API ───────────────────────────────────────────────────────────
export const timetableAPI = {
  getAll: (params) => api.get('/timetables', { params }),
  create: (data) => api.post('/timetables', data),
  getOne: (id) => api.get(`/timetables/${id}`),
  updateCell: (timetableId, cellId, data) =>
    api.put(`/timetables/cell/${cellId}`, data),
  delete: (id) => api.delete(`/timetables/${id}`),
};

// ─── Public API ──────────────────────────────────────────────────────────────
export const publicAPI = {
  getAllTimetables: (params) => api.get('/public/timetables', { params }),
  getPublicTimetable: (id) => api.get(`/public/timetables/${id}`),
};

export default api;
