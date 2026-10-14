import axiosClient from "./axiosClient";

/* CUSTOMER CART */
export const getMyCart = () =>
  axiosClient.get("/customer/cart");

export const addToCart = (data) =>
  axiosClient.post("/customer/cart/items", data);

export const updateCartItem = (itemId, data) =>
  axiosClient.put(`/customer/cart/items/${itemId}`, data);

export const removeCartItem = (itemId) =>
  axiosClient.delete(`/customer/cart/items/${itemId}`);

export const clearCart = () =>
  axiosClient.delete("/customer/cart");

export const setCartStore = (storeId) =>
  axiosClient.put(`/customer/cart/store/${storeId}`);

export const checkoutCart = (data) =>
  axiosClient.post("/customer/cart/checkout", data);

/* STAFF / ADMIN CART MANAGEMENT FOR SPECIFIC USER */
export const getUserCart = (userId, role = "ADMIN") => {
  const prefix = role.toUpperCase().includes("STAFF") ? "/staff/carts" : "/admin/carts";
  return axiosClient.get(`${prefix}/user/${userId}`);
};

export const addItemForUser = (userId, data, role = "ADMIN") => {
  const prefix = role.toUpperCase().includes("STAFF") ? "/staff/carts" : "/admin/carts";
  return axiosClient.post(`${prefix}/user/${userId}/items`, data);
};

export const updateItemForUser = (userId, itemId, data, role = "ADMIN") => {
  const prefix = role.toUpperCase().includes("STAFF") ? "/staff/carts" : "/admin/carts";
  return axiosClient.put(`${prefix}/user/${userId}/items/${itemId}`, data);
};

export const removeItemForUser = (userId, itemId, role = "ADMIN") => {
  const prefix = role.toUpperCase().includes("STAFF") ? "/staff/carts" : "/admin/carts";
  return axiosClient.delete(`${prefix}/user/${userId}/items/${itemId}`);
};

export const clearCartForUser = (userId, role = "ADMIN") => {
  const prefix = role.toUpperCase().includes("STAFF") ? "/staff/carts" : "/admin/carts";
  return axiosClient.delete(`${prefix}/user/${userId}`);
};
