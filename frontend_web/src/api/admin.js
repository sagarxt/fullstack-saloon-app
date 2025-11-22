import axiosClient from "./axiosClient";

// Expected backend: GET /api/v1/admin/dashboard
export const getAdminDashboard = () =>
  axiosClient.get("/admin/dashboard");
