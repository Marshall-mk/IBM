/**
 * IntelliMark App Theme
 * Beautiful gradient-based theme with light and dark mode support
 */

// User page gradient colors (original intensity)
const userGradientColors = ['#FF6B9D', '#C471F5', '#4A90E2'] as const; // Pink to Purple to Blue

// Lighter version of the gradient for global use
const lightGradientColors = [
  'rgba(255, 107, 157, 0.15)', // Very light pink
  'rgba(196, 113, 245, 0.15)', // Very light purple  
  'rgba(74, 144, 226, 0.15)'   // Very light blue
] as const;

// Medium intensity for cards and components
const mediumGradientColors = [
  'rgba(255, 107, 157, 0.3)', // Medium pink
  'rgba(196, 113, 245, 0.3)', // Medium purple
  'rgba(74, 144, 226, 0.3)'   // Medium blue
] as const;

// Dark mode gradient colors
const darkGradientColors = [
  '#1a1a2e', // Dark blue-purple
  '#16213e', // Darker blue
  '#0f1419'  // Very dark
] as const;

// Light theme colors
const lightTheme = {
  text: '#1f2937',
  background: '#ffffff',
  tint: '#4A90E2',
  icon: '#6b7280',
  tabIconDefault: '#9ca3af',
  tabIconSelected: '#4A90E2',
  border: '#e5e7eb',
  card: '#ffffff',
  surface: '#f8fafc',
};

// Dark theme colors
const darkTheme = {
  text: '#f3f4f6',
  background: '#1a1a2e',
  tint: '#FF6B9D',
  icon: '#9ca3af',
  tabIconDefault: '#6b7280',
  tabIconSelected: '#FF6B9D',
  border: '#374151',
  card: '#16213e',
  surface: '#0f1419',
};

export const Colors = {
  light: lightTheme,
  dark: darkTheme,
};

// Helper function to ensure proper typing for LinearGradient
export const getGradient = <T extends readonly string[]>(colors: T): T => colors;

// Gradient combinations for the app
export const Gradients = {
  // User/Settings page - original intensity
  userPage: userGradientColors,
  
  // Light gradients for general app background
  light: {
    primary: lightGradientColors,
    secondary: [lightGradientColors[0], lightGradientColors[1]] as const,
    accent: [lightGradientColors[1], lightGradientColors[2]] as const,
    card: ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.95)'] as const,
    button: ['#4A90E2', '#3b82f6'] as const,
    fab: ['#FF6B9D', '#C471F5'] as const,
    header: ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.95)'] as const,
    tabBar: ['rgba(255, 255, 255, 0.7)', 'rgba(248, 250, 252, 0.8)'] as const,
  },
  
  // Dark mode gradients
  dark: {
    primary: darkGradientColors,
    secondary: [darkGradientColors[0], darkGradientColors[1]] as const,
    accent: [darkGradientColors[1], darkGradientColors[2]] as const,
    card: ['rgba(22, 33, 62, 0.95)', 'rgba(15, 20, 25, 0.95)'] as const,
    button: ['#FF6B9D', '#C471F5'] as const,
    fab: ['#FF6B9D', '#C471F5'] as const,
    header: ['rgba(26, 26, 46, 0.95)', 'rgba(22, 33, 62, 0.95)'] as const,
    tabBar: [darkGradientColors[2], 'rgba(26, 26, 46, 0.98)'] as const,
  },
  
  // Medium intensity gradients for special components
  medium: mediumGradientColors,
  
  // Legacy support (keeping old names for backward compatibility)
  primary: lightGradientColors,
  secondary: [lightGradientColors[0], lightGradientColors[1]] as const,
  accent: [lightGradientColors[1], lightGradientColors[2]] as const,
  card: ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.95)'] as const,
  button: ['#4A90E2', '#3b82f6'] as const,
  fab: ['#FF6B9D', '#C471F5'] as const,
  header: ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.95)'] as const,
};
