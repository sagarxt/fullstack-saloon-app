import axiosClient from "./axiosClient";

/* BOOKINGS */
export const createBooking = (data) =>
  axiosClient.post("/customer/bookings", data);

export const getMyBookings = () =>
  axiosClient.get("/customer/bookings");

export const getMyBookingDetails = (id) =>
  axiosClient.get(`/customer/bookings/${id}`);

export const cancelBooking = (id) =>
  axiosClient.put(`/customer/bookings/${id}/cancel`);

export const rescheduleBooking = (bookingId, scheduledAt) =>
  axiosClient.put(`/customer/bookings/${bookingId}/reschedule`, { scheduledAt });

export const addServiceToBooking = (bookingId, serviceId) =>
  axiosClient.post(`/customer/bookings/${bookingId}/services/${serviceId}`);

export const removeServiceFromBooking = (bookingId, itemId) =>
  axiosClient.delete(`/customer/bookings/${bookingId}/items/${itemId}`);

export const getSlotAvailability = (date, serviceId) =>
  axiosClient.get("/customer/bookings/slots", {
    params: { date, serviceId },
  });

export const previewBooking = (data) =>
  axiosClient.post("/customer/bookings/preview", data);

export const applyCoupon = (code, cartAmount = 0) =>
  axiosClient.get(`/admin/coupons/validate?code=${encodeURIComponent(code)}&cartAmount=${cartAmount}`);

/* POINTS & REWARDS */
export const getRewardBalance = () =>
  axiosClient.get("/customer/points/balance");

export const getRewardLedger = () =>
  axiosClient.get("/customer/points/history");

export const getAvailableRewards = () =>
  axiosClient.get("/customer/rewards/available");

export const getAllRewards = () =>
  axiosClient.get("/customer/rewards/all");

export const redeemReward = (id) =>
  axiosClient.post(`/customer/rewards/redeem/${id}`);

export const getMyVouchers = () =>
  axiosClient.get("/customer/rewards/my-vouchers");

/* PROFILE */
export const getMyProfile = () =>
  axiosClient.get("/customer/profile");

export const updateMyProfile = (data) =>
  axiosClient.put("/customer/profile", data);

export const changePassword = (data) =>
  axiosClient.put("/customer/profile/change-password", data);

/* PAYMENTS & CHECKOUT */
export const checkoutPayment = (data) =>
  axiosClient.post("/customer/payments/checkout", data);

export const getMyPayments = (page = 0, size = 20) =>
  axiosClient.get(`/customer/payments?page=${page}&size=${size}`);

/* NOTIFICATIONS */
export const getNotifications = (page = 0, size = 20) =>
  axiosClient.get(`/customer/notifications?page=${page}&size=${size}`);

export const getUnreadNotificationCount = () =>
  axiosClient.get("/customer/notifications/unread-count");

export const markNotificationSeen = (id) =>
  axiosClient.post(`/customer/notifications/${id}/seen`);

export const markAllNotificationsSeen = () =>
  axiosClient.post("/customer/notifications/mark-all-seen");

export const clearAllNotifications = () =>
  axiosClient.delete("/customer/notifications");

/* REVIEWS */
export const createReview = (data) =>
  axiosClient.post("/customer/reviews", data);

export const getMyReviews = (page = 0, size = 10) =>
  axiosClient.get(`/customer/reviews/my?page=${page}&size=${size}`);

export const deleteMyReview = (id) =>
  axiosClient.delete(`/customer/reviews/${id}`);

/* REFERRALS */
export const getReferralCode = () =>
  axiosClient.get("/customer/referrals/code");

export const getReferralHistory = () =>
  axiosClient.get("/customer/referrals/history");