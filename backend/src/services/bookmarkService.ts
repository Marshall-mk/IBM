import { PrismaClient } from '@prisma/client';
import { BookmarkData, BookmarkFilter, SearchResult } from '../types';

const prisma = new PrismaClient();

export class BookmarkService {
  async getBookmarks(userId: string, filter?: BookmarkFilter): Promise<BookmarkData[]> {
    const where: any = { userId };

    // Apply filters
    if (filter?.isRead !== undefined) {
      where.isRead = filter.isRead;
    }

    if (filter?.isFavorite !== undefined) {
      where.isFavorite = filter.isFavorite;
    }

    if (filter?.searchQuery) {
      where.OR = [
        { title: { contains: filter.searchQuery, mode: 'insensitive' } },
        { content: { contains: filter.searchQuery, mode: 'insensitive' } },
        { url: { contains: filter.searchQuery, mode: 'insensitive' } },
      ];
    }

    if (filter?.dateRange && filter.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filter.dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      where.createdAt = {
        gte: startDate,
      };
    }

    const bookmarks = await prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return bookmarks.map(this.transformBookmark);
  }

  async getBookmark(id: string, userId: string): Promise<BookmarkData | null> {
    const bookmark = await prisma.bookmark.findFirst({
      where: { id, userId },
    });

    return bookmark ? this.transformBookmark(bookmark) : null;
  }

  async createBookmark(userId: string, data: {
    url: string;
    title: string;
    content?: string;
    categories?: string[];
  }): Promise<BookmarkData> {
    const { url, title, content, categories = [] } = data;

    // Extract domain from URL
    const domain = this.extractDomain(url);

    const bookmark = await prisma.bookmark.create({
      data: {
        url,
        title,
        content: content || null,
        domain,
        userId,
        categories: JSON.stringify(categories),
      },
    });

    return this.transformBookmark(bookmark);
  }

  async updateBookmark(id: string, userId: string, data: Partial<BookmarkData>): Promise<BookmarkData | null> {
    const bookmark = await prisma.bookmark.findFirst({
      where: { id, userId },
    });

    if (!bookmark) {
      return null;
    }

    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.isRead !== undefined) updateData.isRead = data.isRead;
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
    if (data.categories !== undefined) updateData.categories = JSON.stringify(data.categories);
    if (data.summary !== undefined) updateData.summary = data.summary;

    const updatedBookmark = await prisma.bookmark.update({
      where: { id },
      data: updateData,
    });

    return this.transformBookmark(updatedBookmark);
  }

  async deleteBookmark(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.bookmark.deleteMany({
        where: { id, userId },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async toggleFavorite(id: string, userId: string): Promise<BookmarkData | null> {
    const bookmark = await prisma.bookmark.findFirst({
      where: { id, userId },
    });

    if (!bookmark) {
      return null;
    }

    const updatedBookmark = await prisma.bookmark.update({
      where: { id },
      data: { isFavorite: !bookmark.isFavorite },
    });

    return this.transformBookmark(updatedBookmark);
  }

  async markAsRead(id: string, userId: string): Promise<BookmarkData | null> {
    const bookmark = await prisma.bookmark.findFirst({
      where: { id, userId },
    });

    if (!bookmark) {
      return null;
    }

    const updatedBookmark = await prisma.bookmark.update({
      where: { id },
      data: { isRead: true },
    });

    return this.transformBookmark(updatedBookmark);
  }

  async searchBookmarks(userId: string, query: string, useAI: boolean = false): Promise<SearchResult[]> {
    const bookmarks = await this.getBookmarks(userId, { searchQuery: query });

    if (!useAI) {
      // Simple search without AI
      return bookmarks.map(bookmark => ({
        ...bookmark,
        relevanceScore: this.calculateRelevanceScore(bookmark, query),
      }));
    }

    // TODO: Implement AI-powered search with OpenAI
    // For now, return simple search with mock AI insights
    return bookmarks.map(bookmark => ({
      ...bookmark,
      relevanceScore: this.calculateRelevanceScore(bookmark, query),
      aiInsight: `This bookmark matches your search for "${query}" based on content analysis.`,
    }));
  }

  async getCategories(userId: string): Promise<string[]> {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      select: { categories: true },
    });

    const allCategories = new Set<string>();
    
    bookmarks.forEach(bookmark => {
      try {
        const categories = JSON.parse(bookmark.categories);
        if (Array.isArray(categories)) {
          categories.forEach(category => allCategories.add(category));
        }
      } catch (error) {
        // Ignore invalid JSON
      }
    });

    return Array.from(allCategories).sort();
  }

  async bulkDelete(ids: string[], userId: string): Promise<number> {
    const result = await prisma.bookmark.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    return result.count;
  }

  private transformBookmark(bookmark: any): BookmarkData {
    let categories: string[] = [];
    let aiAnalysis = undefined;

    try {
      categories = JSON.parse(bookmark.categories);
    } catch (error) {
      categories = [];
    }

    try {
      if (bookmark.aiAnalysis) {
        aiAnalysis = JSON.parse(bookmark.aiAnalysis);
      }
    } catch (error) {
      aiAnalysis = undefined;
    }

    return {
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      content: bookmark.content,
      summary: bookmark.summary,
      domain: bookmark.domain,
      isRead: bookmark.isRead,
      isFavorite: bookmark.isFavorite,
      categories,
      userId: bookmark.userId,
      createdAt: bookmark.createdAt,
      updatedAt: bookmark.updatedAt,
      aiAnalysis,
    };
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return 'unknown';
    }
  }

  private calculateRelevanceScore(bookmark: BookmarkData, query: string): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Title match (highest weight)
    if (bookmark.title.toLowerCase().includes(queryLower)) {
      score += 0.4;
    }

    // Content match
    if (bookmark.content?.toLowerCase().includes(queryLower)) {
      score += 0.3;
    }

    // URL match
    if (bookmark.url.toLowerCase().includes(queryLower)) {
      score += 0.2;
    }

    // Category match
    if (bookmark.categories.some(cat => cat.toLowerCase().includes(queryLower))) {
      score += 0.1;
    }

    return Math.min(score, 1); // Cap at 1.0
  }
}