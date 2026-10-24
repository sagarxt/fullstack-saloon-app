import axiosClient from "./axiosClient";

/* PUBLIC PRODUCT APIS */
export const getPublicProducts = () =>
  axiosClient.get("/public/products");

export const getPublicProduct = (id) =>
  axiosClient.get(`/public/products/${id}`);

export const getProductsByCategory = (cat) =>
  axiosClient.get(`/public/products/category/${encodeURIComponent(cat)}`);

export const searchProducts = (q) =>
  axiosClient.get(`/public/products/search?q=${encodeURIComponent(q)}`);

export const getProductCategories = () =>
  axiosClient.get("/public/products/categories");

export const getPublicProductCategories = () =>
  axiosClient.get("/public/product-categories");

export const getProductBrands = () =>
  axiosClient.get("/public/products/brands");

export {
  getAdminBrands,
  createAdminBrand,
  updateAdminBrand,
  deleteAdminBrand,
  getPublicBrands,
} from "./brand";

/* ADMIN PRODUCT CATEGORY APIS */
export const getAdminProductCategories = () =>
  axiosClient.get("/admin/product-categories");

export const createAdminProductCategory = (data) =>
  axiosClient.post("/admin/product-categories", data);

export const updateAdminProductCategory = (id, data) =>
  axiosClient.put(`/admin/product-categories/${id}`, data);

export const deleteAdminProductCategory = (id) =>
  axiosClient.delete(`/admin/product-categories/${id}`);

/* ADMIN PRODUCT APIS */
export const getAdminProducts = (page = 0, size = 20) =>
  axiosClient.get(`/admin/products?page=${page}&size=${size}`);

export const getAdminProduct = (id) =>
  axiosClient.get(`/admin/products/${id}`);

export const createAdminProduct = (data) =>
  axiosClient.post("/admin/products", data);

export const updateAdminProduct = (id, data) =>
  axiosClient.put(`/admin/products/${id}`, data);

export const deleteAdminProduct = (id) =>
  axiosClient.delete(`/admin/products/${id}`);

export const addProductToBookingAdmin = (bookingId, data) =>
  axiosClient.post(`/admin/products/booking/${bookingId}/add`, data);

export const removeProductFromBookingAdmin = (bookingId, bookingProductId) =>
  axiosClient.delete(`/admin/products/booking/${bookingId}/item/${bookingProductId}`);

export const completeBookingAndSendBillAdmin = (bookingId) =>
  axiosClient.post(`/admin/products/booking/${bookingId}/complete-and-bill`);
