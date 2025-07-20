import { apiService } from './api';
import { BookmarkData, SearchResult, BookmarkFilter, APIResponse } from '../types';

class BookmarkService {
  async getBookmarks(filter?: BookmarkFilter): Promise<BookmarkData[]> {
    const params: any = {};
    
    if (filter?.isRead !== undefined) params.isRead = filter.isRead;
    if (filter?.isFavorite !== undefined) params.isFavorite = filter.isFavorite;
    if (filter?.categories?.length) params.categories = filter.categories.join(',');
    if (filter?.dateRange && filter.dateRange !== 'all') params.dateRange = filter.dateRange;
    if (filter?.searchQuery) params.search = filter.searchQuery;
    
    const response = await apiService.get<{ bookmarks: BookmarkData[] }>('/api/bookmarks', params);
    
    if (response.success && response.data) {
      return response.data.bookmarks;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch bookmarks');
  }

  async getBookmark(id: string): Promise<BookmarkData> {
    const response = await apiService.get<{ bookmark: BookmarkData }>(`/api/bookmarks/${id}`);
    
    if (response.success && response.data) {
      return response.data.bookmark;
    }
    
    throw new Error(response.error?.message || 'Failed to fetch bookmark');
  }

  async createBookmark(data: {
    url: string;
    title: string;
    content?: string;
    categories?: string[];
  }): Promise<BookmarkData> {
    const response = await apiService.post<{ bookmark: BookmarkData }>('/api/bookmarks', data);
    
    if (response.success && response.data) {
      return response.data.bookmark;
    }
    
    throw new Error(response.error?.message || 'Failed to create bookmark');
  }

  async updateBookmark(id: string, data: Partial<BookmarkData>): Promise<BookmarkData> {
    const response = await apiService.put<{ bookmark: BookmarkData }>(`/api/bookmarks/${id}`, data);
    
    if (response.success && response.data) {
      return response.data.bookmark;
    }
    
    throw new Error(response.error?.message || 'Failed to update bookmark');
  }

  async deleteBookmark(id: string): Promise<void> {
    const response = await apiService.delete(`/api/bookmarks/${id}`);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete bookmark');
    }
  }

  async searchBookmarks(query: string, useAI: boolean = false): Promise<SearchResult[]> {
    const params = { search: query };
    if (useAI) {
      (params as any).useAI = 'true';
    }
    
    const response = await apiService.get<{ bookmarks: SearchResult[] }>('/api/bookmarks', params);
    
    if (response.success && response.data) {
      return response.data.bookmarks;
    }
    
    throw new Error(response.error?.message || 'Search failed');
  }

  async toggleFavorite(id: string): Promise<BookmarkData> {
    const response = await apiService.post<{ bookmark: BookmarkData }>(`/api/bookmarks/${id}/favorite`);
    
    if (response.success && response.data) {
      return response.data.bookmark;
    }
    
    throw new Error(response.error?.message || 'Failed to toggle favorite');
  }

  async markAsRead(id: string): Promise<BookmarkData> {
    const response = await apiService.post<{ bookmark: BookmarkData }>(`/api/bookmarks/${id}/read`);
    
    if (response.success && response.data) {
      return response.data.bookmark;
    }
    
    throw new Error(response.error?.message || 'Failed to mark as read');
  }

  async getCategories(): Promise<string[]> {
    const response = await apiService.get<{ categories: string[] }>('/api/bookmarks/categories');
    
    if (response.success && response.data) {
      return response.data.categories;
    }
    
    return [];
  }

  async bulkDelete(ids: string[]): Promise<void> {
    const response = await apiService.post('/api/bookmarks/bulk-delete', { ids });
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete bookmarks');
    }
  }

  async exportBookmarks(format: 'json' | 'csv' | 'html'): Promise<string> {
    const response = await apiService.get<{ data: string }>(`/api/bookmarks/export?format=${format}`);
    
    if (response.success && response.data) {
      return response.data.data;
    }
    
    throw new Error(response.error?.message || 'Failed to export bookmarks');
  }

  async importBookmarks(data: string, format: 'json' | 'csv' | 'html'): Promise<{ imported: number; failed: number }> {
    const response = await apiService.post<{ imported: number; failed: number }>('/api/bookmarks/import', {
      data,
      format,
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to import bookmarks');
  }
}

export const bookmarkService = new BookmarkService();