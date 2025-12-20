import axios from "axios";

const API_BASE_URL = "http://localhost:8008"; 
// For real device WiFi: http://YOUR-IP:8080

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }
});

export const loginApi = async (email: string, password: string) => {
  const res = await api.post("/api/auth/login", { email, password });
  return res.data;
};

export const registerApi = async (name: string, email: string, password: string) => {
  const res = await api.post("/api/auth/register", { name, email, password });
  return res.data;
};
