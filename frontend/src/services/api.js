/**
 * API Service - Axios configuration and API client
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Campuses API
export const campusesAPI = {
  getAll: () => api.get('/admin/campuses'),
  create: (data) => api.post('/admin/campuses', data),
  update: (id, data) => api.put(`/admin/campuses/${id}`, data),
  delete: (id) => api.delete(`/admin/campuses/${id}`),
};

// Department Chairs API
export const chairsAPI = {
  getAll: () => api.get('/admin/chairs'),
  create: (data) => api.post('/admin/chairs', data),
  update: (id, data) => api.put(`/admin/chairs/${id}`, data),
  delete: (id) => api.delete(`/admin/chairs/${id}`),
};

// Departments API
export const departmentsAPI = {
  getAll: () => api.get('/admin/departments'),
  create: (data) => api.post('/admin/departments', data),
  update: (id, data) => api.put(`/admin/departments/${id}`, data),
  delete: (id) => api.delete(`/admin/departments/${id}`),
};

// Semesters API
export const semestersAPI = {
  getAll: (includeRequests = false) => api.get('/admin/semesters', { params: { include_requests: includeRequests } }),
  getById: (id) => api.get(`/admin/semesters/${id}`),
  create: (data) => api.post('/admin/semesters', data),
  update: (id, data) => api.put(`/admin/semesters/${id}`, data),
  delete: (id) => api.delete(`/admin/semesters/${id}`),
  sendReminders: (id, requestIds) => api.post(`/admin/semesters/${id}/send-reminders`, { request_ids: requestIds }),
};

// Department Chair Submission API (public - no auth required, uses token)
export const submitAPI = {
  getRequestByToken: (token) => api.get(`/submit/${token}`),
  addAdjunct: (token, data) => api.post(`/submit/${token}/adjuncts`, data),
  removeAdjunct: (token, assignmentId) => api.delete(`/submit/${token}/adjuncts/${assignmentId}`),
  submitRequest: (token) => api.post(`/submit/${token}/submit`),
};

export default api;
