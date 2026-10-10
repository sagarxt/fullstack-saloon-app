import axiosClient from "./axiosClient";

/* CATEGORIES */
export const getCategoriesApi = () =>
  axiosClient.get("/admin/categories");

export const addCategoryApi = (data) =>
  axiosClient.post("/admin/categories", data);

export const updateCategoryApi = (id, data) =>
  axiosClient.put(`/admin/categories/${id}`, data);

export const deactivateCategoryApi = (id) =>
  axiosClient.delete(`/admin/categories/${id}`);

/* SERVICES */
export const getServicesByCategoryApi = (categoryId) =>
  axiosClient.get(`/admin/services?categoryId=${categoryId}`);

export const getServicesApi = () =>
  axiosClient.get("/admin/services");

export const addServiceApi = (data) =>
  axiosClient.post("/admin/services", data);

export const updateServiceApi = (id, data) =>
  axiosClient.put(`/admin/services/${id}`, data);

export const deactivateServiceApi = (id) =>
  axiosClient.delete(`/admin/services/${id}`);

/* BOOKINGS */
export const getBookings = (status) =>
  axiosClient.get(`/admin/bookings${status ? `?status=${status}` : ""}`);

export const updateBookingStatus = (id, status) =>
  axiosClient.put(`/admin/bookings/${id}/status?status=${status}`);

export const getBookingDetails = (id) =>
  axiosClient.get(`/admin/bookings/${id}`);

export const cancelBookingByAdmin = (id, note) =>
  axiosClient.post(`/admin/bookings/${id}/cancel?note=${encodeURIComponent(note || "")}`);

/* DASHBOARD */
export const getDashboardMetrics = () =>
  axiosClient.get("/admin/dashboard");

/* USERS & STAFF */
export const getUsersApi = (role, page = 0, size = 50) =>
  axiosClient.get(`/admin/users${role ? `?role=${role}&` : "?"}page=${page}&size=${size}`);

export const createStaffApi = (data) =>
  axiosClient.post("/admin/users/staff", data);

export const createCustomerByAdminApi = (data) =>
  axiosClient.post("/admin/users/customer", data);

export const deactivateUserApi = (id) =>
  axiosClient.delete(`/admin/users/${id}`);

/* COUPONS */
export const getCouponsApi = () =>
  axiosClient.get("/admin/coupons");

export const createCouponApi = (data) =>
  axiosClient.post("/admin/coupons", data);

export const updateCouponApi = (id, data) =>
  axiosClient.put(`/admin/coupons/${id}`, data);

export const deleteCouponApi = (id) =>
  axiosClient.delete(`/admin/coupons/${id}`);

/* PAYMENTS */
export const getPaymentsApi = (page = 0, size = 50) =>
  axiosClient.get(`/admin/payments?page=${page}&size=${size}`);

/* BANNERS */
export const getBannersApi = () =>
  axiosClient.get("/admin/banners");

export const createBannerApi = (data) =>
  axiosClient.post("/admin/banners", data);

export const deleteBannerApi = (id) =>
  axiosClient.delete(`/admin/banners/${id}`);

/* REVIEWS */
export const getAllReviewsApi = (page = 0, size = 50) =>
  axiosClient.get(`/admin/reviews?page=${page}&size=${size}`);

export const deleteReviewByAdminApi = (id) =>
  axiosClient.delete(`/admin/reviews/${id}`);