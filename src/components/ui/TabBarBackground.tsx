import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Gradients, getGradient } from '../../../src/constants/Colors';

export default function GradientTabBarBackground() {
  const { isDarkMode } = useTheme();
  
  return (
    <LinearGradient
      colors={getGradient(isDarkMode ? Gradients.dark.tabBar : Gradients.light.tabBar)}
      style={StyleSheet.absoluteFill}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    />
  );
}

export function useBottomTabOverflow() {
  return 0;
}
