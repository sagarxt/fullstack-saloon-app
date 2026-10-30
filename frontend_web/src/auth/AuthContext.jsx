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
      const rawToken = res.data.token || res.data.accessToken;
      const userObj = res.data.user || {
        id: res.data.userId,
        email: res.data.email,
        name: res.data.name,
        role: res.data.role,
      };

      const normalizedUser = {
        ...userObj,
        token: rawToken,
      };

      setUser(normalizedUser);
      setToken(rawToken);
      if (rawToken) localStorage.setItem("token", rawToken);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      let role = userObj.role;
      if (!role && rawToken) {
        try {
          const decoded = JSON.parse(atob(rawToken.split('.')[1]));
          role = decoded.role || (decoded.roles && decoded.roles[0]);
        } catch {
          // ignore
        }
      }

      if (role && (role.includes("ADMIN") || role.includes("ROLE_ADMIN"))) {
        navigate("/admin");
      } else if (role && (role.includes("STAFF") || role.includes("ROLE_STAFF"))) {
        navigate("/staff");
      } else {
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get("redirect") || sessionStorage.getItem("redirectAfterLogin");
        if (redirectUrl) {
          sessionStorage.removeItem("redirectAfterLogin");
          navigate(redirectUrl, { replace: true });
        } else if (window.location.pathname === "/login") {
          navigate(-1);
        }
      }
    } catch (err) {
      throw err;
    }
  };

  const register = async (payload) => {
    try {
      const res = await axiosClient.post("/auth/register", payload);

      const userId = res.data.userId || res.data.id;
      let rawToken = res.data.accessToken || res.data.token || null;
      const role = res.data.role;

      if (!rawToken && payload.email && payload.password) {
        try {
          const autoLogin = await axiosClient.post("/auth/login", {
            email: payload.email,
            password: payload.password,
          });
          rawToken = autoLogin.data.token || autoLogin.data.accessToken;
        } catch {
          // ignore
        }
      }

      setUser({
        id: userId,
        email: res.data.email,
        name: res.data.name,
        role: role,
      });

      if (rawToken) {
        setToken(rawToken);
        localStorage.setItem("token", rawToken);
      }

      if (role === "ROLE_ADMIN") {
        navigate("/admin");
      } else if (role === "ROLE_STAFF") {
        navigate("/staff");
      } else {
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get("redirect") || sessionStorage.getItem("redirectAfterLogin");
        if (redirectUrl) {
          sessionStorage.removeItem("redirectAfterLogin");
          navigate(redirectUrl, { replace: true });
        } else if (window.location.pathname === "/register") {
          navigate(-1);
        }
      }

      return res.data;
    } catch (err) {
      // alert(err.response?.data?.error || "Register failed");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await axiosClient.post("/auth/logout");
    } catch (e) {
      // ignore
    }
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
