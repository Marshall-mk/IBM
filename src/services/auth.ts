import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import { User, AuthResponse, LoginRequest, RegisterRequest, APIResponse } from '../types';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      await this.storeUser(response.data.user);
      await this.storeTokens(response.data.tokens);
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Login failed');
  }

  async register(userData: RegisterRequest): Promise<User> {
    const response = await apiService.post<{ user: User }>('/auth/register', userData);
    
    if (response.success && response.data) {
      return response.data.user;
    }
    
    throw new Error(response.error?.message || 'Registration failed');
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    }
    
    await AsyncStorage.multiRemove([
      'accessToken',
      'refreshToken',
      'tokenExpiry',
      'user',
    ]);
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        return JSON.parse(userString);
      }
      
      // If no cached user, fetch from API
      const response = await apiService.get<{ user: User }>('/auth/profile');
      if (response.success && response.data) {
        await this.storeUser(response.data.user);
        return response.data.user;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    
    return null;
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiService.put<{ user: User }>('/auth/profile', userData);
    
    if (response.success && response.data) {
      await this.storeUser(response.data.user);
      return response.data.user;
    }
    
    throw new Error(response.error?.message || 'Profile update failed');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiService.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Password change failed');
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const response = await apiService.post('/auth/password-reset', { email });
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Password reset request failed');
    }
  }

  async updateBriefingPreferences(preferences: {
    enabled: boolean;
    frequency: string;
    time: string;
    categories: string[];
  }): Promise<void> {
    const response = await apiService.put('/auth/briefing-preferences', preferences);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update briefing preferences');
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return await apiService.isAuthenticated();
  }

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('accessToken');
  }

  private async storeUser(user: User): Promise<void> {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  }

  private async storeTokens(tokens: any): Promise<void> {
    await AsyncStorage.multiSet([
      ['accessToken', tokens.accessToken],
      ['refreshToken', tokens.refreshToken],
      ['tokenExpiry', (Date.now() + tokens.expiresIn * 1000).toString()],
    ]);
  }
}

export const authService = new AuthService();