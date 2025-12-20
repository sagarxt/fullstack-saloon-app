import axiosClient from "./axiosClient";

// Expected backend: GET /api/v1/staff/dashboard
export const getStaffDashboard = () =>
  axiosClient.get("/staff/dashboard");
