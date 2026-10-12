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
export const getBookings = (status, storeId) => {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.append("status", status);
  if (storeId && storeId !== "ALL") params.append("storeId", storeId);
  const q = params.toString();
  return axiosClient.get(`/admin/bookings${q ? `?${q}` : ""}`);
};

export const updateBookingStatus = (id, status) =>
  axiosClient.put(`/admin/bookings/${id}/status?status=${status}`);

export const updateBookingDetails = (id, data) =>
  axiosClient.put(`/admin/bookings/${id}`, data);

export const getBookingDetails = (id) =>
  axiosClient.get(`/admin/bookings/${id}`);

export const cancelBookingByAdmin = (id, note) =>
  axiosClient.post(`/admin/bookings/${id}/cancel?note=${encodeURIComponent(note || "")}`);

/* DASHBOARD */
export const getDashboardMetrics = () =>
  axiosClient.get("/admin/dashboard");

/* USERS & STAFF */
export const getUsersApi = (role, page = 0, size = 50) => {
  const normRole = role && !role.startsWith("ROLE_") && role !== "ALL" ? `ROLE_${role}` : role;
  return axiosClient.get(`/admin/users${normRole ? `?role=${normRole}&` : "?"}page=${page}&size=${size}`);
};

export const createStaffApi = (data) =>
  axiosClient.post("/admin/users/staff", data);

export const createCustomerByAdminApi = (data) =>
  axiosClient.post("/admin/users/customer", data);

export const updateUserApi = (id, data) =>
  axiosClient.put(`/admin/users/${id}`, data);

export const deactivateUserApi = (id) =>
  axiosClient.delete(`/admin/users/${id}`);

/* CUSTOMER PROFILE & REWARDS (ACCESSIBLE BY ADMIN & STAFF) */
export const getCustomerProfileApi = (id) =>
  axiosClient.get(`/staff/customers/${id}`);

export const getCustomerPointsApi = (id) =>
  axiosClient.get(`/staff/customers/${id}/points`);

export const getCustomerPointsHistoryApi = (id, page = 0, size = 20) =>
  axiosClient.get(`/staff/customers/${id}/points/history?page=${page}&size=${size}`);

export const getCustomerBookingsApi = (customerId, page = 0, size = 20) =>
  axiosClient.get(`/staff/bookings/customer/${customerId}?page=${page}&size=${size}`);

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

/* REWARD VOUCHERS */
export const getAdminRewardsApi = (params = {}) => {
  const query = new URLSearchParams();
  if (params.title) query.append("title", params.title);
  if (params.active !== undefined && params.active !== null && params.active !== "") {
    query.append("active", params.active);
  }
  if (params.page !== undefined) query.append("page", params.page);
  if (params.size !== undefined) query.append("size", params.size);
  const qs = query.toString();
  return axiosClient.get(`/admin/rewards${qs ? `?${qs}` : ""}`);
};

export const createAdminRewardApi = (data) =>
  axiosClient.post("/admin/rewards", data);

export const updateAdminRewardApi = (id, data) =>
  axiosClient.put(`/admin/rewards/${id}`, data);

export const deactivateAdminRewardApi = (id) =>
  axiosClient.delete(`/admin/rewards/${id}`);

/* BRANCH STORE CATALOG & INVENTORY (ADMIN) */
export const getAdminStoreServices = (storeId) =>
  axiosClient.get(`/admin/stores/${storeId}/services`);

export const toggleAdminStoreService = (storeId, serviceId) =>
  axiosClient.put(`/admin/stores/${storeId}/services/${serviceId}/toggle`);

export const getAdminStoreProducts = (storeId) =>
  axiosClient.get(`/admin/stores/${storeId}/products`);

export const updateAdminStoreProductStock = (storeId, productId, data) =>
  axiosClient.put(`/admin/stores/${storeId}/products/${productId}/stock`, data);