import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '../../src/components/HapticTab';
import { IconSymbol } from '../../src/components/ui/IconSymbol';
import TabBarBackground from '../../src/components/ui/TabBarBackground';
import { Colors } from '../../src/constants/Colors';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function TabLayout() {
  const { colorScheme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the gradient effect
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          default: {
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bookmarks',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bookmark.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="clusters"
        options={{
          title: 'Clusters',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="square.stack.3d.up.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="declutter"
        options={{
          title: 'Declutter',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.slash.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
