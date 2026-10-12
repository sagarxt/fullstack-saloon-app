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

export const addServiceToBookingByStaff = (bookingId, serviceId) =>
  axiosClient.post(`/staff/bookings/${bookingId}/services/${serviceId}`);

export const removeServiceFromBookingByStaff = (bookingId, itemId) =>
  axiosClient.delete(`/staff/bookings/${bookingId}/items/${itemId}`);

export const getCustomerBookingsByStaff = (customerId, page = 0, size = 20) =>
  axiosClient.get(`/staff/bookings/customer/${customerId}?page=${page}&size=${size}`);

/* STAFF CUSTOMERS */
export const createCustomerByStaff = (data) =>
  axiosClient.post("/staff/customers", data);

export const updateCustomerByStaff = (id, data) =>
  axiosClient.put(`/staff/customers/${id}`, data);

export const getCustomerHistoryByStaff = (id) =>
  axiosClient.get(`/staff/customers/${id}`);

export const getCustomerPointsByStaff = (id) =>
  axiosClient.get(`/staff/customers/${id}/points`);

export const getCustomerPointsHistoryByStaff = (id, page = 0, size = 20) =>
  axiosClient.get(`/staff/customers/${id}/points/history?page=${page}&size=${size}`);

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

/* STAFF STORE CATALOG & INVENTORY (OWN BRANCH) */
export const getStaffStoreInfo = () =>
  axiosClient.get("/staff/store/info");

export const getStaffStoreServices = () =>
  axiosClient.get("/staff/store/services");

export const toggleStaffStoreService = (serviceId) =>
  axiosClient.put(`/staff/store/services/${serviceId}/toggle`);

export const getStaffStoreProducts = () =>
  axiosClient.get("/staff/store/products");

export const updateStaffStoreProductStock = (productId, data) =>
  axiosClient.put(`/staff/store/products/${productId}/stock`, data);

/* STAFF BRANCH ANALYTICS */
export const getStaffBranchAnalytics = (period = "WEEK", startDate = null, endDate = null) => {
  const params = new URLSearchParams();
  if (period) params.append("period", period);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  return axiosClient.get(`/staff/dashboard/analytics?${params.toString()}`);
};

/* STAFF PROFILE & BRANCH DETAILS */
export const getStaffProfile = () =>
  axiosClient.get("/staff/profile");

export const updateStaffProfile = (data) =>
  axiosClient.put("/staff/profile", data);

export const changeStaffPassword = (data) =>
  axiosClient.put("/staff/profile/change-password", data);

