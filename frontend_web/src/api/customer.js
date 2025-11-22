import axiosClient from "./axiosClient";

// Expected backend: GET /api/v1/customer/dashboard or /home
export const getCustomerDashboard = () =>
  axiosClient.get("/customer/dashboard"); // or "/customer/home" if you prefer
