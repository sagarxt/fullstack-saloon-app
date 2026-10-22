import axiosClient from "./axiosClient";

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

export const getServicesByCategoryApi = (categoryId) =>
  axiosClient.get(`/admin/services?categoryId=${categoryId}`);

export const addServiceApi = (data) => {
  if (data instanceof FormData) {
    return axiosClient.post("/admin/services", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return axiosClient.post("/admin/services", data);
};

export const updateServiceApi = (id, data) => {
  if (data instanceof FormData) {
    return axiosClient.put(`/admin/services/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return axiosClient.put(`/admin/services/${id}`, data);
};

export const deactivateServiceApi = (id) =>
  axiosClient.delete(`/admin/services/${id}`);

export const activateServiceApi = (id) =>
  axiosClient.put(`/admin/services/${id}/status?active=true`);

export const toggleServiceStatusApi = (id, active) => {
  const query = active !== undefined ? `?active=${active}` : "";
  return axiosClient.put(`/admin/services/${id}/status${query}`);
};

export const getPublicServicesApi = () =>
  axiosClient.get("/public/services");

export default {
  getServicesApi,
  getServicesByCategoryApi,
  addServiceApi,
  updateServiceApi,
  deactivateServiceApi,
  activateServiceApi,
  toggleServiceStatusApi,
  getPublicServicesApi,
};
