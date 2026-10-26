import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('banking_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized, clean up token if invalid
    if (error.response && error.response.status === 401) {
      const message = error.response.data?.message || '';
      if (message.includes('expired') || message.includes('Invalid token')) {
        localStorage.removeItem('banking_token');
        localStorage.removeItem('banking_user');
      }
    }
    return Promise.reject(error);
  }
);

// Customer API Services
export const customerService = {
  register: (data) => api.post('/api/customers/register', data),
  login: (credentials) => api.post('/api/customers/login', credentials),
  getProfile: () => api.get('/api/customers/me'),
  getHealth: () => api.get('/api/health')
};

// Account API Services
export const accountService = {
  createAccount: (data) => api.post('/api/accounts', data),
  getAccounts: (customerId) => {
    const query = customerId ? `?customerId=${customerId}` : '';
    return api.get(`/api/accounts${query}`);
  },
  getAccountById: (id) => api.get(`/api/accounts/${id}`),
  deposit: (id, data) => api.post(`/api/accounts/${id}/deposit`, data),
  withdraw: (id, data) => api.post(`/api/accounts/${id}/withdraw`, data),
  transfer: (data) => api.post('/api/accounts/transfer', data),
  getTransactions: (id) => api.get(`/api/accounts/${id}/transactions`)
};

export default api;
