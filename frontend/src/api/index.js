import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle response errors
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            toast.error('Session expired. Please login again.');
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (data) => API.post('/auth/login', data),
    getMe: () => API.get('/auth/me'),
};

// Product API
export const productAPI = {
    getAll: () => API.get('/products'),
    create: (data) => API.post('/products', data),
    update: (id, data) => API.put(`/products/${id}`, data),
    delete: (id) => API.delete(`/products/${id}`),
};

// Stock API
export const stockAPI = {
    getByStore: (storeId) => API.get(`/stock/store/${storeId}`),
    getSummary: () => API.get('/stock/summary'),  // CHANGE THIS
    add: (data) => API.post('/stock/add', data),
    getLowStock: () => API.get('/stock/low-stock'),
};

// Sales API
export const saleAPI = {
    create: (data) => API.post('/sales', data),
    getAll: () => API.get('/sales'),
    getDailySummary: (date) => API.get(`/sales/daily-summary?date=${date}`),
};

// Debtor API
export const debtorAPI = {
    getAll: () => API.get('/debtors'),
    create: (data) => API.post('/debtors', data),
    recordPayment: (data) => API.post('/debtors/payments', data),
    getPayments: (id) => API.get(`/debtors/${id}/payments`),
};

// Transfer API
export const transferAPI = {
    create: (data) => API.post('/transfers', data),
    getAll: () => API.get('/transfers'),
};

// Report API
export const reportAPI = {
    getDaily: (date) => API.get(`/reports/daily?date=${date}`),
    getMonthly: (month, year) => API.get(`/reports/monthly?month=${month}&year=${year}`),
    getStock: () => API.get('/reports/stock'),
    getLowStock: () => API.get('/reports/low-stock'),
    getDebtors: () => API.get('/reports/debtors'),
    getProfit: () => API.get('/reports/profit'),
    getFull: (date) => API.get(`/reports/full?date=${date}`),
};

export default API;
