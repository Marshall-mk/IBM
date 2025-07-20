export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  plan?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
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
  firstName?: string;
  lastName?: string;
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
  previewImage?: string;
  isRead: boolean;
  isFavorite: boolean;
  categories: string[];
  createdAt: string;
  updatedAt: string;
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

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  autoSync: boolean;
  briefingEmail: boolean;
  briefingFrequency: 'daily' | 'weekly' | 'monthly';
  briefingTime: string;
}

export interface SyncStatus {
  lastSync: number;
  pendingItems: number;
  isOnline: boolean;
  canSync: boolean;
}

export interface APIError {
  message: string;
  code?: string;
  details?: any;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  message?: string;
}

export interface BookmarkFilter {
  isRead?: boolean;
  isFavorite?: boolean;
  categories?: string[];
  dateRange?: 'all' | 'week' | 'month' | 'year';
  searchQuery?: string;
}

export interface BriefingData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  bookmarks: BookmarkData[];
  summary: string;
}

export interface BookmarkCluster {
  id: string;
  title: string;
  description: string;
  type: 'date' | 'category';
  bookmarks: BookmarkData[];
  createdAt: string;
  color: string;
  icon: string;
  metadata?: {
    dateRange?: string;
    keywords?: string[];
  };
}

export type ClusteringMethod = 'date' | 'category' | 'auto';