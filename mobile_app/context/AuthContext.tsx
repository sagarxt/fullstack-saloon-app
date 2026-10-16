import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/client';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  token: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; referralCode?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await AsyncStorage.multiGet(['token', 'user']);
      const t = storedToken[1];
      const u = storedUser[1];
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
      }
    } catch (_) {}
    finally { setIsLoading(false); }
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const data = res.data;
    const t = data.token || data.accessToken || data.jwt || data.user?.token;
    const userData = data.user || data;
    const u: User = {
      id: userData.id || userData.userId,
      name: userData.name || userData.fullName,
      email: userData.email,
      phone: userData.phone,
      role: userData.role || 'ROLE_CUSTOMER',
      token: t,
      profileImage: userData.profileImage,
    };
    await AsyncStorage.multiSet([['token', t], ['user', JSON.stringify(u)]]);
    setToken(t);
    setUser(u);
  };

  const register = async (data: { name: string; email: string; password: string; referralCode?: string }) => {
    const res = await authApi.register(data);
    const resData = res.data;
    const t = resData?.token;
    if (t) {
      const u: User = {
        id: resData.id,
        name: resData.name,
        email: resData.email,
        phone: resData.phone,
        role: resData.role || 'ROLE_CUSTOMER',
        token: t,
        profileImage: resData.profileImage,
      };
      await AsyncStorage.multiSet([['token', t], ['user', JSON.stringify(u)]]);
      setToken(t);
      setUser(u);
    } else {
      await login(data.email, data.password);
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (_) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
