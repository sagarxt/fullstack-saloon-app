import { createContext, useState } from "react";
import { logoutApi } from "../api/auth";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch {
            return null;
        }
    });

    const login = (data) => {
        const userObj = data.user || data;
        const token = data.token || data.accessToken || userObj.token;
        const normalizedUser = {
            id: userObj.id,
            name: userObj.name,
            email: userObj.email,
            role: (userObj.role || "").replace("ROLE_", ""), 
            token: token,
        };

        setUser(normalizedUser);
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        if (token) {
            localStorage.setItem("token", token);
        }
    };

    const logout = async () => {
        try {
            await logoutApi();
        } catch (e) {
            // ignore logout error
        }
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
