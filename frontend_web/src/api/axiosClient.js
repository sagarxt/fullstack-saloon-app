import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8008/api/v1",
});

// Attach token to every request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // or AuthContext token
  console.log("Attaching token to request:", token);
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  console.log("👉 Axios Request:", config.method, config.url);
  console.log("👉 Sending Token:", localStorage.getItem("token"));

  return config;
});

export default axiosClient;
