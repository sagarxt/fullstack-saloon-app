// src/api/admin.js
import axiosClient from "./axiosClient";

export const adminGetStats = () => axiosClient.get("/admin/stats");

// ---------------------------
// SERVICES
// ---------------------------
export const adminGetServices = () => axiosClient.get("/admin/services");
export const adminCreateService = (payload) =>
  axiosClient.post("/admin/services", payload);
export const adminUpdateService = (id, payload) =>
  axiosClient.put(`/admin/services/${id}`, payload);
export const adminDeleteService = (id) =>
  axiosClient.delete(`/admin/services/${id}`);

// ---------------------------
// REWARDS
// ---------------------------
export const adminGetRewards = () => axiosClient.get("/admin/rewards");
export const adminCreateReward = (payload) =>
  axiosClient.post("/admin/rewards", payload);
export const adminUpdateReward = (id, payload) =>
  axiosClient.put(`/admin/rewards/${id}`, payload);
export const adminDeleteReward = (id) =>
  axiosClient.delete(`/admin/rewards/${id}`);

// ---------------------------
// BOOKINGS
// ---------------------------
export const adminGetBookings = () => axiosClient.get("/admin/bookings");

// ★ NEW: Filter API
export const adminFilterBookings = (params) =>
  axiosClient.get(`/admin/bookings/filter`, { params });

export const adminUpdateBookingStatus = (id, status) =>
  axiosClient.put(`/admin/bookings/${id}/status?status=${status}`);

export const adminDeleteBooking = (id) =>
  axiosClient.delete(`/admin/bookings/${id}`);

// ---------------------------
// CUSTOMERS
// ---------------------------
export const adminGetCustomers = () => axiosClient.get("/admin/customers");
export const adminDeleteCustomer = (id) => axiosClient.delete(`/admin/customers/${id}`);
export const adminGetCustomerDetail = (id) => axiosClient.get(`/admin/customers/${id}/details`);
export const adminSearchCustomers = (keyword) => axiosClient.get(`/admin/customers/search?keyword=${keyword}`);


