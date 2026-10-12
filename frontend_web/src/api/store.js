import axiosClient from "./axiosClient";

export const storeApi = {
  // Public
  getPublicStores: (lat, lng) => {
    const params = {};
    if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
      params.lat = lat;
      params.lng = lng;
    }
    return axiosClient.get("/public/stores", { params });
  },

  getPublicStoreById: (id) => axiosClient.get(`/public/stores/${id}`),

  getStoreServices: (storeId) => axiosClient.get(`/public/stores/${storeId}/services`),

  getStoreProducts: (storeId) => axiosClient.get(`/public/stores/${storeId}/products`),

  // Admin
  getAdminStores: () => axiosClient.get("/admin/stores"),

  createStore: (data) => axiosClient.post("/admin/stores", data),

  updateStore: (id, data) => axiosClient.put(`/admin/stores/${id}`, data),

  toggleStore: (id) => axiosClient.patch(`/admin/stores/${id}/toggle`),

  deleteStore: (id) => axiosClient.delete(`/admin/stores/${id}`),
};
