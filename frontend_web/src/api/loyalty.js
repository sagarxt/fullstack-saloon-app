import axiosClient from "./axiosClient";

export const getGroomCoinConfigApi = () => {
  return axiosClient.get("/public/groom-coin/config");
};

export const updateGroomCoinConfigApi = (data) => {
  return axiosClient.put("/admin/groom-coin/config", data);
};
