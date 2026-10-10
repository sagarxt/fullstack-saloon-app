import axiosClient from "./axiosClient";

/* STAFF DASHBOARD */
export const getStaffDashboard = () =>
  axiosClient.get("/staff/dashboard");

/* STAFF BOOKINGS */
export const getStaffBooking = (id) =>
  axiosClient.get(`/staff/bookings/${id}`);

export const cancelStaffBooking = (id, note = "") =>
  axiosClient.post(`/staff/bookings/${id}/cancel?note=${encodeURIComponent(note)}`);

export const updateStaffBooking = (id, data) =>
  axiosClient.put(`/staff/bookings/${id}`, data);

export const getCustomerBookingsByStaff = (customerId, page = 0, size = 20) =>
  axiosClient.get(`/staff/bookings/customer/${customerId}?page=${page}&size=${size}`);

/* STAFF CUSTOMERS */
export const createCustomerByStaff = (data) =>
  axiosClient.post("/staff/customers", data);

export const updateCustomerByStaff = (id, data) =>
  axiosClient.put(`/staff/customers/${id}`, data);

export const getCustomerHistoryByStaff = (id) =>
  axiosClient.get(`/staff/customers/${id}`);

/* STAFF SERVICES */
export const getStaffServices = () =>
  axiosClient.get("/staff/services");

/* STAFF PRODUCTS & BILLING */
export const getStaffProducts = () =>
  axiosClient.get("/staff/products");

export const addProductToBookingByStaff = (bookingId, data) =>
  axiosClient.post(`/staff/products/booking/${bookingId}/add`, data);

export const removeProductFromBookingByStaff = (bookingId, bookingProductId) =>
  axiosClient.delete(`/staff/products/booking/${bookingId}/item/${bookingProductId}`);

export const completeBookingAndSendBillByStaff = (bookingId) =>
  axiosClient.post(`/staff/products/booking/${bookingId}/complete-and-bill`);
