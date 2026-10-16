import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

function getBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1' && !host.includes('exp.direct') && !host.includes('ngrok')) {
      return `http://${host}:8008/api/v1`;
    }
  }
  return 'http://192.168.0.110:8008/api/v1';
}

const BASE_URL = getBaseUrl();

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
  timeout: 15000,
});

// Attach JWT token to every request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (_) {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

/* ─── AUTH ─── */
export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  register: (data: { name: string; email: string; password: string; referralCode?: string }) =>
    apiClient.post('/auth/register', data),
  sendOtp: (data: { email: string }) =>
    apiClient.post('/auth/send-otp', data),
  verifyOtp: (data: { email: string; otp: string }) =>
    apiClient.post('/auth/verify-otp', data),
  verifyReferral: (code: string) =>
    apiClient.get(`/auth/verify-referral?code=${encodeURIComponent(code)}`),
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; newPassword: string }) =>
    apiClient.post('/auth/reset-password', data),
};

/* ─── PUBLIC ─── */
export const publicApi = {
  getStores: (lat?: number, lng?: number) => {
    const params: any = {};
    if (lat !== undefined && lng !== undefined) {
      params.lat = lat; params.lng = lng;
    }
    return apiClient.get('/public/stores', { params });
  },
  getStore: (id: number) => apiClient.get(`/public/stores/${id}`),
  getStoreServices: (storeId: number) => apiClient.get(`/public/stores/${storeId}/services`),
  getStoreProducts: (storeId: number) => apiClient.get(`/public/stores/${storeId}/products`),
  getServices: () => apiClient.get('/public/services'),
  getCategories: () => apiClient.get('/public/categories'),
  getCategoryDetail: (id: number) => apiClient.get(`/public/categories/${id}`),
  getProducts: () => apiClient.get('/public/products'),
  getProduct: (id: number) => apiClient.get(`/public/products/${id}`),
  getProductsByCategory: (cat: string) => apiClient.get(`/public/products/category/${encodeURIComponent(cat)}`),
  searchProducts: (q: string) => apiClient.get(`/public/products/search?q=${encodeURIComponent(q)}`),
  getProductCategories: () => apiClient.get('/public/products/categories'),
  getProductBrands: () => apiClient.get('/public/products/brands'),
  getGroomCoinConfig: () => apiClient.get('/public/groom-coin/config'),
};

/* ─── CUSTOMER ─── */
export const customerApi = {
  // Profile
  getProfile: () => apiClient.get('/customer/profile'),
  updateProfile: (data: any) => apiClient.put('/customer/profile', data),
  changePassword: (data: any) => apiClient.put('/customer/profile/change-password', data),

  // Bookings
  getBookings: () => apiClient.get('/customer/bookings'),
  getBookingDetail: (id: number) => apiClient.get(`/customer/bookings/${id}`),
  cancelBooking: (id: number) => apiClient.put(`/customer/bookings/${id}/cancel`),
  rescheduleBooking: (id: number, scheduledAt: string) =>
    apiClient.put(`/customer/bookings/${id}/reschedule`, { scheduledAt }),
  getSlotAvailability: (date: string, serviceId: number) =>
    apiClient.get('/customer/bookings/slots', { params: { date, serviceId } }),
  previewBooking: (data: any) => apiClient.post('/customer/bookings/preview', data),
  createBooking: (data: any) => apiClient.post('/customer/bookings', data),
  addServiceToBooking: (bookingId: number, serviceId: number) =>
    apiClient.post(`/customer/bookings/${bookingId}/services/${serviceId}`),

  // Points & Rewards
  getRewardBalance: () => apiClient.get('/customer/points/balance'),
  getRewardLedger: () => apiClient.get('/customer/points/history'),
  getAvailableRewards: () => apiClient.get('/customer/rewards/available'),
  getAllRewards: () => apiClient.get('/customer/rewards/all'),
  redeemReward: (id: number) => apiClient.post(`/customer/rewards/redeem/${id}`),
  getMyVouchers: () => apiClient.get('/customer/rewards/my-vouchers'),

  // Cart
  getCart: () => apiClient.get('/customer/cart'),
  addToCart: (data: any) => apiClient.post('/customer/cart/items', data),
  updateCartItem: (itemId: number, data: any) => apiClient.put(`/customer/cart/items/${itemId}`, data),
  removeCartItem: (itemId: number) => apiClient.delete(`/customer/cart/items/${itemId}`),
  clearCart: () => apiClient.delete('/customer/cart'),
  setCartStore: (storeId: number) => apiClient.put(`/customer/cart/store/${storeId}`),

  // Payments
  checkoutPayment: (data: any) => apiClient.post('/customer/payments/checkout', data),
  createRazorpayOrder: (data: any) => apiClient.post('/customer/payments/razorpay/create-order', data),
  verifyRazorpayPayment: (data: any) => apiClient.post('/customer/payments/razorpay/verify', data),
  switchToPayAtSalon: (bookingId: number) => apiClient.post('/customer/payments/switch-to-salon', { bookingId }),
  getMyPayments: (page = 0, size = 20) => apiClient.get(`/customer/payments?page=${page}&size=${size}`),

  // Notifications
  getNotifications: (page = 0, size = 20) => apiClient.get(`/customer/notifications?page=${page}&size=${size}`),
  getUnreadCount: () => apiClient.get('/customer/notifications/unread-count'),
  markNotificationSeen: (id: number) => apiClient.post(`/customer/notifications/${id}/seen`),
  markAllSeen: () => apiClient.post('/customer/notifications/mark-all-seen'),
  clearNotifications: () => apiClient.delete('/customer/notifications'),

  // Vouchers
  applyCoupon: (code: string, cartAmount = 0) =>
    apiClient.get(`/public/coupons/validate?code=${encodeURIComponent(code)}&cartAmount=${cartAmount}`),

  // Referrals
  getReferralCode: () => apiClient.get('/customer/referrals/code'),
  getReferralHistory: () => apiClient.get('/customer/referrals/history'),

  // Reviews
  createReview: (data: any) => apiClient.post('/customer/reviews', data),
  getReviewsForBooking: (bookingId: number) => apiClient.get(`/customer/reviews/booking/${bookingId}`),
  getMyReviews: (page = 0, size = 10) => apiClient.get(`/customer/reviews/my?page=${page}&size=${size}`),
  deleteReview: (id: number) => apiClient.delete(`/customer/reviews/${id}`),
};
