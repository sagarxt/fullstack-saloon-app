import axiosClient from "./axiosClient";

export const getPublicHome = () => {
  return axiosClient.get("/public/home");
};
