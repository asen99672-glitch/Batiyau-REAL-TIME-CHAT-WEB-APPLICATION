import axios from 'axios';

// Axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - har request ke saath JWT token add karo
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('chatToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - 401 Unauthorized pe auto logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('chatToken');
      localStorage.removeItem('chatUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
