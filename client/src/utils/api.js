import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// 1. AUTOMATICALLY ATTACH TOKEN
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. AUTO-LOGOUT ON 401 ERROR
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token is invalid/expired -> Force Logout
      console.warn("Session expired or unauthorized. Logging out...");
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      // Optional: Force reload to show login screen
      // window.location.reload(); 
    }
    return Promise.reject(error);
  }
);

export const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/300?text=No+Image';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
};

export default api;
