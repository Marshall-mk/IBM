import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { BookmarkData } from '../types';
import { bookmarkService } from '../services/bookmarks';

interface BookmarkContextType {
  bookmarks: BookmarkData[];
  loading: boolean;
  refreshBookmarks: () => Promise<void>;
  addBookmark: (bookmark: BookmarkData) => void;
  updateBookmark: (id: string, updates: Partial<BookmarkData>) => void;
  deleteBookmark: (id: string) => void;
  deleteBookmarks: (ids: string[]) => void;
  markAsRead: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

interface BookmarkProviderProps {
  children: ReactNode;
}

export function BookmarkProvider({ children }: BookmarkProviderProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [loading, setLoading] = useState(false);

  const getSampleBookmarks = (): BookmarkData[] => [
    {
      id: '1',
      url: 'https://huggingface.co/papers',
      title: 'HuggingFace Papers',
      content: 'Latest AI research papers and models from the HuggingFace community.',
      domain: 'huggingface.co',
      previewImage: 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg',
      isRead: false,
      isFavorite: true,
      categories: ['Learning', 'Research'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      url: 'https://github.com/microsoft/vscode',
      title: 'VS Code Repository',
      content: 'Visual Studio Code - The popular code editor by Microsoft.',
      domain: 'github.com',
      previewImage: 'https://github.com/microsoft/vscode/raw/main/resources/linux/code.png',
      isRead: true,
      isFavorite: false,
      categories: ['Git/Code', 'Tools'],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      url: 'https://www.twitter.com/reactjs',
      title: 'React on Twitter',
      content: 'Official React Twitter account with updates and news.',
      domain: 'twitter.com',
      isRead: false,
      isFavorite: false,
      categories: ['Social', 'Git/Code'],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  const refreshBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to load from backend first
      try {
        const data = await bookmarkService.getBookmarks();
        setBookmarks(data);
      } catch (error) {
        // If backend is not available, use sample data
        console.log('Backend not available, using sample data');
        setBookmarks(getSampleBookmarks());
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      // Fallback to sample data
      setBookmarks(getSampleBookmarks());
    } finally {
      setLoading(false);
    }
  }, []);

  const addBookmark = useCallback((bookmark: BookmarkData) => {
    setBookmarks(prev => [bookmark, ...prev]);
  }, []);

  const updateBookmark = useCallback((id: string, updates: Partial<BookmarkData>) => {
    setBookmarks(prev => prev.map(bookmark => 
      bookmark.id === id ? { ...bookmark, ...updates } : bookmark
    ));
  }, []);

  const deleteBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
  }, []);

  const deleteBookmarks = useCallback((ids: string[]) => {
    setBookmarks(prev => prev.filter(bookmark => !ids.includes(bookmark.id)));
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      // Update local state immediately
      updateBookmark(id, { isRead: true });
      
      // Try to update backend
      try {
        await bookmarkService.markAsRead(id);
      } catch (error) {
        console.log('Backend unavailable, local update only');
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [updateBookmark]);

  const toggleFavorite = useCallback(async (id: string) => {
    try {
      // Find current bookmark to toggle its favorite status
      const currentBookmark = bookmarks.find(b => b.id === id);
      if (!currentBookmark) return;

      // Update local state immediately
      updateBookmark(id, { isFavorite: !currentBookmark.isFavorite });
      
      // Try to update backend
      try {
        await bookmarkService.toggleFavorite(id);
      } catch (error) {
        console.log('Backend unavailable, local update only');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [bookmarks, updateBookmark]);

  const value: BookmarkContextType = {
    bookmarks,
    loading,
    refreshBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    deleteBookmarks,
    markAsRead,
    toggleFavorite,
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
}