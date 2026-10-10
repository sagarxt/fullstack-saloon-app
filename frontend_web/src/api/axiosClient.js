import axios from "axios";
import { toastEmitter } from "../utils/toastEmitter";

const axiosClient = axios.create({
  baseURL: "http://localhost:8008/api/v1",
});

// Attach token to every outgoing request
axiosClient.interceptors.request.use(
  (config) => {
    let token = null;

    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        token = user?.token;
      }
    } catch (e) {
      // ignore json parse error
    }

    if (!token) {
      token = localStorage.getItem("token");
    }

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error & 401 session expiration handling
let isHandling401 = false;

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Clear expired credentials
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      if (!isHandling401) {
        isHandling401 = true;

        // Show popup toast message
        toastEmitter.error(
          "Session expired or unauthorized. Please log in again.",
          "Authentication Required"
        );

        // Redirect to Login if not already on authentication pages
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/register") {
          setTimeout(() => {
            isHandling401 = false;
            window.location.href = "/login";
          }, 1200);
        } else {
          setTimeout(() => {
            isHandling401 = false;
          }, 3000);
        }
      }
    } else if (status === 403) {
      toastEmitter.error(
        "Access denied. You don't have permission for this resource.",
        "Forbidden"
      );
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
