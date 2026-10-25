import axios from "axios";
import { toastEmitter } from "../utils/toastEmitter";

const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "/api/v1";

const normalizeBaseUrl = (url) => {
  if (!url) return "/api/v1";
  let cleaned = url.replace(/\/+$/, "");
  if (cleaned.startsWith("http") && !cleaned.includes("/api/v1")) {
    cleaned += "/api/v1";
  }
  return cleaned;
};

const axiosClient = axios.create({
  baseURL: normalizeBaseUrl(rawApiUrl),
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

      const reqUrl = error.config?.url || "";
      const isAuthEndpoint =
        reqUrl.includes("/auth/login") ||
        reqUrl.includes("/auth/register") ||
        reqUrl.includes("/auth/send-otp") ||
        reqUrl.includes("/auth/verify-otp") ||
        reqUrl.includes("/auth/verify-referral");

      // Don't pop up "Session expired" or redirect if it was just an auth form attempt
      if (!isAuthEndpoint && !isHandling401) {
        isHandling401 = true;

        // Show popup toast message
        toastEmitter.error(
          "Session expired or unauthorized. Please log in again.",
          "Authentication Required"
        );

        // Remember current path so user can be redirected back to the exact page they were browsing
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem("redirectAfterLogin", currentPath);

        // Redirect to Login if not already on authentication pages
        if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          setTimeout(() => {
            isHandling401 = false;
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
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
