import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  mode: ThemeMode;
  isDark: boolean;
  bg: string;
  bgSecondary: string;
  card: string;
  cardBorder: string;
  headerBg: string;
  headerBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  tabBarBg: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  badgeBg: string;
  divider: string;
  primary: string;
}

const lightTheme: ThemeColors = {
  mode: 'light',
  isDark: false,
  bg: '#F8F6F2', // warm elegant cream
  bgSecondary: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  headerBg: '#FFFFFF',
  headerBorder: '#E2E8F0',
  text: '#1E293B',
  textSecondary: '#475569',
  textMuted: '#64748B',
  inputBg: '#F1F5F9',
  inputBorder: '#CBD5E1',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarActive: Colors.orange,
  tabBarInactive: '#64748B',
  badgeBg: '#F1F5F9',
  divider: '#E2E8F0',
  primary: Colors.orange,
};

const darkTheme: ThemeColors = {
  mode: 'dark',
  isDark: true,
  bg: '#0F172A',
  bgSecondary: '#1E293B',
  card: '#1E293B',
  cardBorder: '#334155',
  headerBg: '#0F172A',
  headerBorder: '#1E293B',
  text: '#FFFFFF',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  inputBg: '#0F172A',
  inputBorder: '#334155',
  tabBarBg: '#0F172A',
  tabBarBorder: '#1E293B',
  tabBarActive: Colors.orange,
  tabBarInactive: '#64748B',
  badgeBg: '#334155',
  divider: '#334155',
  primary: Colors.orange,
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@groomish_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default is 'light' mode as requested!
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        setMode(saved);
      }
    } catch (_) {}
  };

  const setThemeMode = async (newMode: ThemeMode) => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (_) {}
  };

  const toggleTheme = () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setThemeMode(nextMode);
  };

  const colors = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        mode,
        isDark: mode === 'dark',
        toggleTheme,
        setThemeMode,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
