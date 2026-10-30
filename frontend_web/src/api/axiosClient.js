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

const baseURL = normalizeBaseUrl(rawApiUrl);

const axiosClient = axios.create({
  baseURL,
  withCredentials: true, // Crucial: sends & receives HttpOnly refreshToken cookies
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

// Response interceptor with silent token refresh & request queueing
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

let isHandling401 = false;

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      const reqUrl = originalRequest.url || "";
      const isAuthEndpoint =
        reqUrl.includes("/auth/login") ||
        reqUrl.includes("/auth/register") ||
        reqUrl.includes("/auth/refresh") ||
        reqUrl.includes("/auth/send-otp") ||
        reqUrl.includes("/auth/verify-otp") ||
        reqUrl.includes("/auth/verify-referral");

      // Auth endpoint failures (or refresh endpoint failures) should not attempt refresh
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt silent refresh using HttpOnly cookie credentials
        const res = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data?.token || res.data?.accessToken;

        if (newAccessToken) {
          localStorage.setItem("token", newAccessToken);
          try {
            const rawUser = localStorage.getItem("user");
            if (rawUser) {
              const userObj = JSON.parse(rawUser);
              userObj.token = newAccessToken;
              localStorage.setItem("user", JSON.stringify(userObj));
            }
          } catch (e) {
            // ignore parse error
          }

          axiosClient.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          isRefreshing = false;
          return axiosClient(originalRequest);
        } else {
          throw new Error("No token returned in refresh response");
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;

        // Refresh failed (token expired or revoked by password change)
        localStorage.removeItem("user");
        localStorage.removeItem("token");

        if (!isHandling401) {
          isHandling401 = true;

          const errorCode = refreshErr.response?.data?.code || error.response?.data?.code;
          const msg = errorCode === "PASSWORD_CHANGED"
            ? "Your password was changed. Please log in again."
            : "Session expired. Please log in again.";

          toastEmitter.error(msg, "Authentication Required");

          const currentPath = window.location.pathname + window.location.search;
          sessionStorage.setItem("redirectAfterLogin", currentPath);

          if (
            window.location.pathname !== "/login" &&
            window.location.pathname !== "/register"
          ) {
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

        return Promise.reject(refreshErr);
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
