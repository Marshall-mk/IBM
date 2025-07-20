import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface BookmarkData {
  id: string;
  url: string;
  title: string;
  content?: string;
  summary?: string;
  domain: string;
  isRead: boolean;
  isFavorite: boolean;
  categories: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  aiAnalysis?: {
    summary: string;
    categories: string[];
    sentiment: string;
    keyPoints: string[];
  };
}

export interface SearchResult extends BookmarkData {
  relevanceScore?: number;
  aiInsight?: string;
}

export interface BookmarkFilter {
  isRead?: boolean;
  isFavorite?: boolean;
  categories?: string[];
  dateRange?: 'all' | 'week' | 'month' | 'year';
  searchQuery?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  message?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface RequestWithUser extends Request {
  user?: User;
}