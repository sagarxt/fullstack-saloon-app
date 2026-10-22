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

export const activateCategoryApi = (id) =>
  axiosClient.put(`/admin/categories/${id}/status?active=true`);

export const toggleCategoryStatusApi = (id, active) => {
  const query = active !== undefined ? `?active=${active}` : "";
  return axiosClient.put(`/admin/categories/${id}/status${query}`);
};

/* SERVICES */
export const getServicesByCategoryApi = (categoryId) =>
  axiosClient.get(`/admin/services?categoryId=${categoryId}`);

export const getServicesApi = (page = 0, size = 1000) => {
  if (typeof page === "object" && page !== null) {
    const params = page;
    const p = params.page ?? 0;
    const s = params.size ?? 1000;
    const query = new URLSearchParams({ page: p, size: s });
    if (params.categoryId) query.append("categoryId", params.categoryId);
    if (params.gender) query.append("gender", params.gender);
    if (params.active !== undefined) query.append("active", params.active);
    if (params.name) query.append("name", params.name);
    return axiosClient.get(`/admin/services?${query.toString()}`);
  }
  return axiosClient.get(`/admin/services?page=${page}&size=${size}`);
};

export const addServiceApi = (data) =>
  axiosClient.post("/admin/services", data);

export const updateServiceApi = (id, data) =>
  axiosClient.put(`/admin/services/${id}`, data);

export const deactivateServiceApi = (id) =>
  axiosClient.delete(`/admin/services/${id}`);

export const activateServiceApi = (id) =>
  axiosClient.put(`/admin/services/${id}/status?active=true`);

export const toggleServiceStatusApi = (id, active) => {
  const query = active !== undefined ? `?active=${active}` : "";
  return axiosClient.put(`/admin/services/${id}/status${query}`);
};

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
export const getUsersApi = (roleOrParams, page = 0, size = 50, userGroup = null, search = null) => {
  const params = new URLSearchParams();
  if (typeof roleOrParams === "object" && roleOrParams !== null) {
    if (roleOrParams.role && roleOrParams.role !== "ALL") {
      const normRole = !roleOrParams.role.startsWith("ROLE_") ? `ROLE_${roleOrParams.role}` : roleOrParams.role;
      params.append("role", normRole);
    }
    if (roleOrParams.page !== undefined) params.append("page", roleOrParams.page);
    if (roleOrParams.size !== undefined) params.append("size", roleOrParams.size);
    if (roleOrParams.userGroup && roleOrParams.userGroup !== "ALL") params.append("userGroup", roleOrParams.userGroup);
    if (roleOrParams.search) params.append("search", roleOrParams.search);
    if (roleOrParams.active !== undefined && roleOrParams.active !== null) params.append("active", roleOrParams.active);
  } else {
    const normRole = roleOrParams && !roleOrParams.startsWith("ROLE_") && roleOrParams !== "ALL" ? `ROLE_${roleOrParams}` : roleOrParams;
    if (normRole) params.append("role", normRole);
    params.append("page", page);
    params.append("size", size);
    if (userGroup && userGroup !== "ALL") params.append("userGroup", userGroup);
    if (search) params.append("search", search);
  }
  return axiosClient.get(`/admin/users?${params.toString()}`);
};

export const getUserGroupsCatalogApi = () =>
  axiosClient.get("/admin/users/groups");

export const updateUserGroupsApi = (id, groups) =>
  axiosClient.put(`/admin/users/${id}/groups`, groups);

export const sendEmailToUserGroupApi = (data) =>
  axiosClient.post("/admin/users/email-group", data);

export const createStaffApi = (data) =>
  axiosClient.post("/admin/users/staff", data);

export const createCustomerByAdminApi = (data) =>
  axiosClient.post("/admin/users/customer", data);

export const updateUserApi = (id, data) =>
  axiosClient.put(`/admin/users/${id}`, data);

export const toggleUserStatusApi = (id, active) => {
  const query = typeof active === "boolean" ? `?active=${active}` : "";
  return axiosClient.put(`/admin/users/${id}/status${query}`);
};

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