import axiosClient from "./axiosClient";

/* ADMIN BRAND APIS */
export const getAdminBrands = () => axiosClient.get("/admin/brands");

export const getAdminBrand = (id) => axiosClient.get(`/admin/brands/${id}`);

export const createAdminBrand = (data) => axiosClient.post("/admin/brands", data);

export const updateAdminBrand = (id, data) => axiosClient.put(`/admin/brands/${id}`, data);

export const deleteAdminBrand = (id) => axiosClient.delete(`/admin/brands/${id}`);

/* PUBLIC BRAND APIS */
export const getPublicBrands = () => axiosClient.get("/public/brands");

export const getPublicBrand = (id) => axiosClient.get(`/public/brands/${id}`);

export const brandApi = {
  getAdminBrands,
  getAdminBrand,
  createAdminBrand,
  updateAdminBrand,
  deleteAdminBrand,
  getPublicBrands,
  getPublicBrand,
};

export default brandApi;
