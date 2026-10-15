import axiosClient from "./axiosClient";

export const clearDatabasesApi = (options) =>
  axiosClient.post("/admin/maintenance/clear", options);

export const forceDeleteCategoryApi = (id) =>
  axiosClient.delete(`/admin/maintenance/categories/${id}`);

export const forceDeleteServiceApi = (id) =>
  axiosClient.delete(`/admin/maintenance/services/${id}`);

export const forceDeleteProductApi = (id) =>
  axiosClient.delete(`/admin/maintenance/products/${id}`);

export const forceDeleteStoreApi = (id) =>
  axiosClient.delete(`/admin/maintenance/stores/${id}`);

export const forceDeleteCustomerApi = (id) =>
  axiosClient.delete(`/admin/maintenance/customers/${id}`);

export const forceDeleteStaffApi = (id) =>
  axiosClient.delete(`/admin/maintenance/staff/${id}`);

export const forceDeleteCouponApi = (id) =>
  axiosClient.delete(`/admin/maintenance/coupons/${id}`);

export const forceDeleteBookingApi = (id) =>
  axiosClient.delete(`/admin/maintenance/bookings/${id}`);

export const forceDeleteRewardApi = (id) =>
  axiosClient.delete(`/admin/maintenance/rewards/${id}`);

export const forceDeleteReviewApi = (id) =>
  axiosClient.delete(`/admin/maintenance/reviews/${id}`);

export default {
  clearDatabasesApi,
  forceDeleteCategoryApi,
  forceDeleteServiceApi,
  forceDeleteProductApi,
  forceDeleteStoreApi,
  forceDeleteCustomerApi,
  forceDeleteStaffApi,
  forceDeleteCouponApi,
  forceDeleteBookingApi,
  forceDeleteRewardApi,
  forceDeleteReviewApi,
};
