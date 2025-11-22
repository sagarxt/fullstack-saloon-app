import axiosClient from "./axiosClient";

export const loginApi = (data) =>
  axiosClient.post("/auth/login", data);

export const registerApi = (data) =>
  axiosClient.post("/auth/register", data);

export const sendOtpApi = (data) =>
  axiosClient.post("/auth/send-otp", data);

export const verifyOtpApi = (data) =>
  axiosClient.post("/auth/verify-otp", data);
