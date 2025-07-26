import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
};

export const ridesAPI = {
  getRoutes: () => api.get('/routes'),
  requestRide: (routeId) => api.post('/rides/request', { routeId }),
  acceptRide: (rideId) => api.post(`/rides/${rideId}/accept`),
  startTrip: (rideId) => api.post(`/rides/${rideId}/start`),
  completeTrip: (rideId) => api.post(`/rides/${rideId}/complete`),
  getRideHistory: () => api.get('/rides/history'),
  getActiveRide: () => api.get('/rides/active'),
};

export const paymentsAPI = {
  processPayment: (data) => api.post('/payments/process', data),
  getPaymentHistory: () => api.get('/payments/history'),
  getEarnings: () => api.get('/payments/earnings'),
};

export const driversAPI = {
  updateStatus: (status) => api.put('/drivers/status', { status }),
  getAvailableDrivers: () => api.get('/drivers/available'),
};

export const notificationsAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

export default api; 