import axiosClient from "./axiosClient";

// Expected backend: GET /api/v1/admin/dashboard
export const getAdminDashboard = () =>
  axiosClient.get("/admin/dashboard");

export const getAdminCategories = ({ page = 0, size = 20, search, active } = {}) => {
  const params = { page, size };
  if (search) params.search = search;
  if (active !== undefined && active !== "ALL") {
    // active: true / false
    params.active = active === "ACTIVE";
  }
  return axiosClient.get("/admin/categories", { params });
};

export const createAdminCategory = (formData) =>
  axiosClient.post("/admin/categories", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateAdminCategory = (id, formData) =>
  axiosClient.put(`/admin/categories/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteAdminCategory = (id) =>
  axiosClient.delete(`/admin/categories/${id}`);

export const getAdminServices = ({ page = 0, size = 20, search, active, categoryId } = {}) => {
  const params = { page, size };
  if (search) params.search = search;
  if (active !== undefined && active !== "ALL") {
    // active: true / false
    params.active = active === "ACTIVE";
  }
  if (categoryId !== undefined && categoryId !== "ALL") params.categoryId = categoryId;
  return axiosClient.get("/admin/services", { params });
};
export const createAdminService = (formData) =>
  axiosClient.post("/admin/services", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateAdminService = (id, formData) =>
  axiosClient.put(`/admin/services/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteAdminService = (id) =>
  axiosClient.delete(`/admin/services/${id}`);

export const getAdminStaff = () =>
  axiosClient.get("/admin/staff");