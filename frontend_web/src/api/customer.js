// src/api/customer.js
import axiosClient from "./axiosClient";

export const getDashboard = () => axiosClient.get("/customer/dashboard");

export const getPoints = () => axiosClient.get("/points/balance");
export const getPointsLedger = () => axiosClient.get("/points/ledger");

export const getRewards = () => axiosClient.get("/rewards");
export const redeemReward = (rewardId) => axiosClient.post(`/rewards/${rewardId}/redeem`);

export const getServices = () => axiosClient.get("/services");
export const getService = (id) => axiosClient.get(`/services/${id}`);

export const createBooking = (payload) => axiosClient.post("/bookings", payload);

// ✅ FIX: Add this
export const getMyBookings = () => axiosClient.get("/customer/bookings");

// Single booking (if needed later)
export const getMyBooking = (id) => axiosClient.get(`/customer/bookings/${id}`);

export const cancelMyBooking = (id) => axiosClient.delete(`/customer/bookings/${id}`);

export const getProfile = () => axiosClient.get("/users/me");
export const updateProfile = (payload) => axiosClient.put("/users/me", payload);

export const getReferrals = () => axiosClient.get("/referrals/me");
