import axiosClient from "./axiosClient";

export const getCategoriesApi = () =>
  axiosClient.get("/admin/categories");

export const addCategoryApi = (data) => {
  if (data instanceof FormData) {
    return axiosClient.post("/admin/categories", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return axiosClient.post("/admin/categories", data);
};

export const updateCategoryApi = (id, data) => {
  if (data instanceof FormData) {
    return axiosClient.put(`/admin/categories/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return axiosClient.put(`/admin/categories/${id}`, data);
};

export const deactivateCategoryApi = (id) =>
  axiosClient.delete(`/admin/categories/${id}`);

export const getPublicCategoriesApi = () =>
  axiosClient.get("/public/categories");

export default {
  getCategoriesApi,
  addCategoryApi,
  updateCategoryApi,
  deactivateCategoryApi,
  getPublicCategoriesApi,
};
