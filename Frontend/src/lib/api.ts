import axios from "axios";
import { toast } from "sonner";

// Use environment variable or default to localhost:5000/api/v1
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("assetflow_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.error || "Something went wrong";

    if (status === 401) {
      toast.error("Session expired. Please log in again.");
      localStorage.removeItem("assetflow_token");
      localStorage.removeItem("assetflow_user");
      // Redirect to login if not already there
      if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/signup")) {
        window.location.href = "/login";
      }
    } else if (status === 403) {
      toast.error("Access denied: " + message);
    } else if (status === 400 || status === 409) {
      toast.error(message);
    } else if (status >= 500) {
      toast.error("Server error: Please try again later.");
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);
