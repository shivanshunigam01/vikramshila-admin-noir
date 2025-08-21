import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // if backend uses cookies
});

// ✅ Request interceptor: attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor: handle 401 / errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto-logout if unauthorized
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default axiosInstance;
