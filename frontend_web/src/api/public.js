import axiosClient from "./axiosClient";

export const getPublicHome = () => {
  return axiosClient.get("/public/home");
};

export const getCategories = () => {
  return axiosClient.get("/public/categories");
};

export const getServices = () => {
  return axiosClient.get("/public/services");
};

export const getServiceReviews = (serviceId, page = 0, size = 10) => {
  return axiosClient.get(`/public/reviews/service/${serviceId}?page=${page}&size=${size}`);
};

export const getServiceRatingSummary = (serviceId) => {
  return axiosClient.get(`/public/reviews/service/${serviceId}/summary`);
};