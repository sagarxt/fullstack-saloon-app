import { createContext, useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }, [token, user]);

  const login = async (email, password) => {
    try {
      const res = await axiosClient.post("/auth/login", { email, password });

      setUser({
        id: res.data.userId,
        email: res.data.email,
        name: res.data.name,
      });

      setToken(res.data.accessToken);

      // role stored inside JWT? Extract manually OR include role in response
      const decoded = JSON.parse(atob(res.data.accessToken.split('.')[1]));
      const role = decoded.role;

      if (role === "ROLE_ADMIN") navigate("/admin");
      else navigate("/customer");

    } catch (err) {
      // alert(err.response?.data?.error || "Login failed");
      throw err;
    }
  };

  const register = async (payload) => {
    try {
      const res = await axiosClient.post("/auth/register", payload);

      setUser({
        id: res.data.userId,
        email: res.data.email,
        name: res.data.name,
      });

      setToken(res.data.accessToken);

      const decoded = JSON.parse(atob(res.data.accessToken.split('.')[1]));
      const role = decoded.role;

      if (role === "ROLE_ADMIN") navigate("/admin");
      else navigate("/customer");

    } catch (err) {
      // alert(err.response?.data?.error || "Register failed");
      throw err;
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
