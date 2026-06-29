import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: attach JWT token ────────────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: handle auth errors globally ────────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';

    // Auto logout on 401
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject({ ...error, message });
  }
);

// ─── Auth APIs ────────────────────────────────────────────────────────────────
export const authAPI = {
  register:              (data)        => API.post('/auth/register', data),
  login:                 (data)        => API.post('/auth/login', data),
  getMe:                 ()            => API.get('/auth/me'),
  updateProfile:         (data)        => API.put('/auth/profile', data),
  changePassword:        (data)        => API.put('/auth/change-password', data),
  forgotPassword:        (data)        => API.post('/auth/forgot-password', data),
  resetPassword:         (token, data) => API.put(`/auth/reset-password/${token}`, data),
  getNotifications:      (params)      => API.get('/auth/notifications', { params }),
  markNotificationsRead: ()            => API.put('/auth/notifications/read-all'),
};

// ─── Complaint APIs ───────────────────────────────────────────────────────────
export const complaintAPI = {
  create:         (data)   => API.post('/complaints', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll:         (params) => API.get('/complaints', { params }),
  getById:        (id)     => API.get(`/complaints/${id}`),
  update:         (id, data) => API.put(`/complaints/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete:         (id)     => API.delete(`/complaints/${id}`),
  assign:         (id, data) => API.put(`/complaints/${id}/assign`, data),
  updateStatus:   (id, data) => API.put(`/complaints/${id}/status`, data),
  getStats:       ()       => API.get('/complaints/stats'),
  removeAttachment: (id, filename) => API.delete(`/complaints/${id}/attachment/${filename}`),
};

// ─── Category APIs ────────────────────────────────────────────────────────────
export const categoryAPI = {
  getAll:         (params) => API.get('/categories', { params }),
  getById:        (id)     => API.get(`/categories/${id}`),
  getStats:       ()       => API.get('/categories/stats'),
  create:         (data)   => API.post('/categories', data),
  update:         (id, data) => API.put(`/categories/${id}`, data),
  delete:         (id)     => API.delete(`/categories/${id}`),
  toggle:         (id)     => API.patch(`/categories/${id}/toggle`),
};

// ─── User APIs ────────────────────────────────────────────────────────────────
export const userAPI = {
  getAll:         (params) => API.get('/users', { params }),
  getById:        (id)     => API.get(`/users/${id}`),
  getAgents:      ()       => API.get('/users/agents'),
  create:         (data)   => API.post('/users', data),
  update:         (id, data) => API.put(`/users/${id}`, data),
  delete:         (id)     => API.delete(`/users/${id}`),
  toggle:         (id)     => API.patch(`/users/${id}/toggle`),
  resetPassword:  (id, data) => API.put(`/users/${id}/reset-password`, data),
  getComplaints:  (id, params) => API.get(`/users/${id}/complaints`, { params }),
};

// ─── Agent APIs ───────────────────────────────────────────────────────────────
export const agentAPI = {
  getStats:          ()        => API.get('/agent/stats'),
  getProfileSummary: ()        => API.get('/agent/profile-summary'),
  getComplaints:     (params)  => API.get('/agent/complaints', { params }),
  getComplaintById:  (id)      => API.get(`/agent/complaints/${id}`),
  updateStatus:      (id, data) => API.put(`/agent/complaints/${id}/status`, data),
  addNotes:          (id, data) => API.put(`/agent/complaints/${id}/notes`, data),
};

export default API;