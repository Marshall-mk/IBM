import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APIResponse, AuthTokens } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001';

class APIService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.api.post('/auth/refresh', {
                refreshToken,
              });
              
              const { tokens } = response.data.data;
              await this.storeTokens(tokens);
              
              originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.clearTokens();
            throw refreshError;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private async storeTokens(tokens: AuthTokens) {
    await AsyncStorage.multiSet([
      ['accessToken', tokens.accessToken],
      ['refreshToken', tokens.refreshToken],
      ['tokenExpiry', (Date.now() + tokens.expiresIn * 1000).toString()],
    ]);
  }

  private async clearTokens() {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'tokenExpiry']);
  }

  async get<T>(endpoint: string, params?: any): Promise<APIResponse<T>> {
    try {
      const response: AxiosResponse<APIResponse<T>> = await this.api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    try {
      const response: AxiosResponse<APIResponse<T>> = await this.api.post(endpoint, data);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    try {
      const response: AxiosResponse<APIResponse<T>> = await this.api.put(endpoint, data);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    try {
      const response: AxiosResponse<APIResponse<T>> = await this.api.delete(endpoint);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): APIResponse<any> {
    if (error.response?.data) {
      return {
        success: false,
        error: {
          message: error.response.data.error || 'An error occurred',
          code: error.response.status?.toString(),
          details: error.response.data,
        },
      };
    }
    
    return {
      success: false,
      error: {
        message: error.message || 'Network error',
        code: 'NETWORK_ERROR',
      },
    };
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('accessToken');
    const expiry = await AsyncStorage.getItem('tokenExpiry');
    
    if (!token || !expiry) return false;
    
    return Date.now() < parseInt(expiry);
  }
}

export const apiService = new APIService();