import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ColorScheme = 'light' | 'dark';
type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ColorScheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@intellimark_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');

  // Load theme preference from storage on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update color scheme based on theme mode and system preference
  useEffect(() => {
    const newColorScheme = themeMode === 'auto' 
      ? (systemColorScheme ?? 'light') 
      : themeMode === 'dark' 
        ? 'dark' 
        : 'light';
    
    setColorScheme(newColorScheme);
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['auto', 'light', 'dark'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.log('Could not load theme preference:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.log('Could not save theme preference:', error);
    }
  };

  const value: ThemeContextType = {
    colorScheme,
    themeMode,
    setThemeMode,
    isDarkMode: colorScheme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Enhanced hook that combines theme context with color utilities
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName?: keyof typeof import('../constants/Colors').Colors.light & keyof typeof import('../constants/Colors').Colors.dark
) {
  const { colorScheme } = useTheme();
  const { Colors } = require('../constants/Colors');
  
  const colorFromProps = props[colorScheme];
  
  if (colorFromProps) {
    return colorFromProps;
  } else if (colorName) {
    return Colors[colorScheme][colorName];
  } else {
    return Colors[colorScheme].text; // Default fallback
  }
}