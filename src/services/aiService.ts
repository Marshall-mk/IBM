import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export interface SummaryOptions {
  maxLength?: number;
  style?: 'brief' | 'detailed' | 'bullet-points';
  includeKeyPoints?: boolean;
}

export interface SummaryResponse {
  summary: {
    id: string;
    url: string;
    title: string;
    content: string;
    categories: string[];
    domain: string;
    aiAnalysis?: {
      summary: string;
      categories: string[];
      sentiment: string;
      keyPoints: string[];
    };
    createdAt: string;
    updatedAt: string;
    isRead: boolean;
    isFavorite: boolean;
  };
}

export interface SummaryError {
  message: string;
  code: string;
  details?: any;
}

export class AIService {
  private static readonly TIMEOUT = 60000; // 60 seconds for AI operations
  
  static async generateSummary(
    bookmarkIds: string[],
    options: SummaryOptions = {},
    token: string
  ): Promise<SummaryResponse> {
    try {
      // Get user's OpenAI API key from storage
      const userApiKey = await AsyncStorage.getItem('openai_api_key');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      
      // Include user's API key if available
      if (userApiKey) {
        headers['X-OpenAI-API-Key'] = userApiKey;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/bookmarks/ai-summarize`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bookmarkIds,
          options,
          apiKey: userApiKey, // Also include in body for backwards compatibility
        }),
        // Note: AbortSignal.timeout not available in React Native, rely on server timeout
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.error?.message || 'Summary generation failed');
      }

      return data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during summary generation');
    }
  }

  static async checkAvailability(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookmarks/ai-summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookmarkIds: [], // Empty request to check availability
        }),
        // Note: AbortSignal.timeout not available in React Native
      });

      const data = await response.json();
      
      // If we get a validation error about empty bookmarkIds, the service is available
      if (response.status === 400 && data.error?.code === 'VALIDATION_ERROR') {
        return true;
      }
      
      // If we get a service unavailable error, the AI service is not configured
      if (response.status === 503 && data.error?.code === 'AI_SERVICE_UNAVAILABLE') {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  static getEstimatedProcessingTime(bookmarkCount: number): number {
    // Rough estimation: 10-30 seconds per article
    return Math.max(10, Math.min(120, bookmarkCount * 20));
  }

  static getSupportedStyles(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'brief',
        label: 'Brief',
        description: 'Concise 1-2 paragraph summary',
      },
      {
        value: 'detailed',
        label: 'Detailed',
        description: 'Comprehensive analysis with insights',
      },
      {
        value: 'bullet-points',
        label: 'Bullet Points',
        description: 'Key points in easy-to-scan format',
      },
    ];
  }
}