import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../src/services/auth';
import { ThemedText } from '../src/components/ThemedText';
import { ThemedView } from '../src/components/ThemedView';
import { Colors } from '../src/constants/Colors';
import { useColorScheme } from '../src/hooks/useColorScheme';

export default function IndexScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  const checkAuthenticationStatus = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        // User is authenticated, redirect to main app
        router.replace('/(tabs)');
      } else {
        // User is not authenticated, redirect to login
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      // On error, redirect to login
      router.replace('/auth/login');
    }
  };

  return (
    <ThemedView style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    }}>
      <ActivityIndicator 
        size="large" 
        color={Colors[colorScheme ?? 'light'].tint} 
        style={{ marginBottom: 16 }}
      />
      <ThemedText style={{
        fontSize: 16,
        opacity: 0.7,
        textAlign: 'center',
      }}>
        Loading IntelliMark...
      </ThemedText>
    </ThemedView>
  );
}