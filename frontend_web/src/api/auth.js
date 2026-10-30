import axiosClient from "./axiosClient";

export const loginApi = (data) =>
  axiosClient.post("/auth/login", data);

export const registerApi = (data) =>
  axiosClient.post("/auth/register", data);

export const refreshTokenApi = (refreshToken) =>
  axiosClient.post("/auth/refresh", refreshToken ? { refreshToken } : {});

export const logoutApi = (refreshToken) =>
  axiosClient.post("/auth/logout", refreshToken ? { refreshToken } : {});

export const sendOtpApi = (data) =>
  axiosClient.post("/auth/send-otp", data);

export const verifyOtpApi = (data) =>
  axiosClient.post("/auth/verify-otp", data);

export const verifyReferralApi = (code) =>
  axiosClient.get(`/auth/verify-referral?code=${encodeURIComponent(code)}`);

export const forgotPasswordApi = (email) =>
  axiosClient.post("/auth/forgot-password", { email });

export const resetPasswordApi = (data) =>
  axiosClient.post("/auth/reset-password", data);
