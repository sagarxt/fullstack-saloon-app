import axiosClient from "./axiosClient";

/* ============================
   DASHBOARD
============================ */

export const getCustomerDashboard = () =>
  axiosClient.get("/customer/home");

/* ============================
   SERVICES (USER SIDE)
============================ */

export const getServices = () =>
  axiosClient.get("/public/services");

export const getServiceById = (id) =>
  axiosClient.get(`/services/${id}`);

export const getCategories = () =>
  axiosClient.get("/public/categories");

/* ============================
   BOOKINGS
============================ */

export const getMyBookings = () =>
  axiosClient.get("/customer/bookings");

export const createBooking = (payload) =>
  axiosClient.post("/customer/bookings", payload);

export const getMyBooking = (id) =>
  axiosClient.get(`/customer/bookings/${id}`);

export const getUnavailableSlots = (date, serviceId) =>
  axiosClient.get("/customer/bookings/slots", {
    params: { date, serviceId },
  });

export const previewBooking = (payload) =>
  axiosClient.post("/customer/bookings/preview", payload);

export const rescheduleBooking = (id, payload) =>
  axiosClient.put(`/customer/bookings/${id}/reschedule`, payload);

export const cancelBooking = (id) =>
  axiosClient.put(`/customer/bookings/${id}/cancel`);


export const getMyProfile = () =>
  axiosClient.get("/customer/profile");

export const updateMyProfile = (payload) =>
  axiosClient.put("/customer/profile", payload);

export const changePassword = (payload) =>
  axiosClient.put("/customer/profile/change-password", payload);
  