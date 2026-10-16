import axiosClient from "./axiosClient";

export const policyFaqApi = {
  // Public APIs
  getPublicItems: (type) =>
    axiosClient.get("/public/policy-faq", { params: type ? { type } : {} }),

  getPublicItemById: (id) =>
    axiosClient.get(`/public/policy-faq/${id}`),

  // Admin APIs
  getAdminItems: (type) =>
    axiosClient.get("/admin/policy-faq", { params: type ? { type } : {} }),

  createItem: (data) =>
    axiosClient.post("/admin/policy-faq", data),

  updateItem: (id, data) =>
    axiosClient.put(`/admin/policy-faq/${id}`, data),

  toggleItemStatus: (id) =>
    axiosClient.patch(`/admin/policy-faq/${id}/toggle-status`),

  forceDeleteItem: (id) =>
    axiosClient.delete(`/admin/policy-faq/${id}`),
};
