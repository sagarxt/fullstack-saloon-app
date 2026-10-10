import axiosClient from "./axiosClient";

export const getServicesApi = () =>
  axiosClient.get("/admin/services");

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

export const getPublicServicesApi = () =>
  axiosClient.get("/public/services");

export default {
  getServicesApi,
  getServicesByCategoryApi,
  addServiceApi,
  updateServiceApi,
  deactivateServiceApi,
  getPublicServicesApi,
};
