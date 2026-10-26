import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const RENDER_BACKEND_URL = 'https://groomish-now-backend.onrender.com/api/v1';

function getBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('loca.lt') && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  return RENDER_BACKEND_URL;
}

const BASE_URL = getBaseUrl();

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Attach JWT token & bypass headers to every request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      config.headers['Bypass-Tunnel-Reminder'] = 'true';
      config.headers['bypass-tunnel-reminder'] = 'true';
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (_) {}

    console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url || ''}`);
    return config;
  },
  (error) => {
    console.error('[API REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorizedCallback(cb: (() => void) | null) {
  onUnauthorizedCallback = cb;
}

// Response interceptor for 401 handling & logging
apiClient.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && (response.data.includes('Friendly Reminder') || response.data.includes('localtunnel') || response.data.trim().startsWith('<!DOCTYPE html>'))) {
      console.warn('[API WARNING] Localtunnel reminder HTML page intercepted instead of JSON:', response.config.url);
      return Promise.reject(new Error('Localtunnel reminder page intercepted'));
    }
    console.log(`[API RESPONSE] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error(
      `[API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.baseURL || ''}${error.config?.url || ''}:`,
      error.message,
      error.code,
      error.response ? `HTTP ${error.response.status}` : 'No response'
    );
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
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
  getStore: (id: string | number) => apiClient.get(`/public/stores/${id}`),
  getStoreServices: (storeId: string | number) => apiClient.get(`/public/stores/${storeId}/services`),
  getStoreProducts: (storeId: string | number) => apiClient.get(`/public/stores/${storeId}/products`),
  getStoreReviews: (storeId: string | number) => apiClient.get(`/public/reviews/store/${storeId}`),
  getServices: () => apiClient.get('/public/services'),
  getService: (id: string | number) => apiClient.get(`/public/services/${id}`),
  getCategories: () => apiClient.get('/public/categories'),
  getCategoryDetail: (id: string | number) => apiClient.get(`/public/categories/${id}`),
  getProducts: () => apiClient.get('/public/products'),
  getProduct: (id: string | number) => apiClient.get(`/public/products/${id}`),
  getProductsByCategory: (cat: string) => apiClient.get(`/public/products/category/${encodeURIComponent(cat)}`),
  searchProducts: (q: string) => apiClient.get(`/public/products/search?q=${encodeURIComponent(q)}`),
  getProductCategories: () => apiClient.get('/public/products/categories'),
  getProductBrands: () => apiClient.get('/public/products/brands'),
  getBrands: () => apiClient.get('/public/brands'),
  getPolicyFaq: (type?: string) => apiClient.get('/public/policy-faq', { params: type ? { type } : {} }),
  getGroomCoinConfig: () => apiClient.get('/public/groom-coin/config'),
  getHomeData: () => apiClient.get('/public/home'),
};

/* ─── CUSTOMER ─── */
export const customerApi = {
  // Profile
  getProfile: () => apiClient.get('/customer/profile'),
  updateProfile: (data: any) => apiClient.put('/customer/profile', data),
  changePassword: (data: any) => apiClient.put('/customer/profile/change-password', data),

  // Bookings
  getBookings: () => apiClient.get('/customer/bookings'),
  getBookingDetail: (id: string | number) => apiClient.get(`/customer/bookings/${id}`),
  cancelBooking: (id: string | number) => apiClient.put(`/customer/bookings/${id}/cancel`),
  rescheduleBooking: (id: string | number, scheduledAt: string) =>
    apiClient.put(`/customer/bookings/${id}/reschedule`, { scheduledAt }),
  getSlotAvailability: (date: string, serviceId?: string | number) =>
    apiClient.get('/customer/bookings/slots', { params: { date, ...(serviceId ? { serviceId } : {}) } }),
  previewBooking: (data: any) => apiClient.post('/customer/bookings/preview', data),
  createBooking: (data: any) => apiClient.post('/customer/bookings', data),
  addServiceToBooking: (bookingId: string | number, serviceId: string | number) =>
    apiClient.post(`/customer/bookings/${bookingId}/services/${serviceId}`),
  removeServiceFromBooking: (bookingId: string | number, itemId: string | number) =>
    apiClient.delete(`/customer/bookings/${bookingId}/items/${itemId}`),

  // Points & Rewards
  getRewardBalance: () => apiClient.get('/customer/points/balance'),
  getRewardLedger: () => apiClient.get('/customer/points/history'),
  getAvailableRewards: () => apiClient.get('/customer/rewards/available'),
  getAllRewards: () => apiClient.get('/customer/rewards/all'),
  redeemReward: (id: string | number) => apiClient.post(`/customer/rewards/redeem/${id}`),
  getMyVouchers: () => apiClient.get('/customer/rewards/my-vouchers'),

  // Cart
  getCart: () => apiClient.get('/customer/cart'),
  addToCart: (data: any) => apiClient.post('/customer/cart/items', data),
  updateCartItem: (itemId: string | number, data: any) => apiClient.put(`/customer/cart/items/${itemId}`, data),
  removeCartItem: (itemId: string | number) => apiClient.delete(`/customer/cart/items/${itemId}`),
  clearCart: () => apiClient.delete('/customer/cart'),
  setCartStore: (storeId: string | number) => apiClient.put(`/customer/cart/store/${storeId}`),
  checkoutCart: (data: any) => apiClient.post('/customer/cart/checkout', data),

  // Payments
  checkoutPayment: (data: any) => apiClient.post('/customer/payments/checkout', data),
  createRazorpayOrder: (data: any) => apiClient.post('/customer/payments/razorpay/create-order', data),
  verifyRazorpayPayment: (data: any) => apiClient.post('/customer/payments/razorpay/verify', data),
  switchToPayAtSalon: (bookingId: string | number) => apiClient.post('/customer/payments/switch-to-salon', { bookingId }),
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
