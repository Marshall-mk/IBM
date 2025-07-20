import { BookmarkData, BookmarkCluster, ClusteringMethod } from '../types';

class ClusteringService {
  private clusterColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  private clusterIcons = [
    'folder', 'library', 'code-slash', 'newspaper', 'school',
    'camera', 'musical-notes', 'fitness', 'restaurant', 'car'
  ];

  async createClusters(bookmarks: BookmarkData[], method: ClusteringMethod = 'auto'): Promise<BookmarkCluster[]> {
    if (bookmarks.length === 0) return [];

    switch (method) {
      case 'date':
        return this.clusterByDate(bookmarks);
      case 'category':
        return this.clusterByCategory(bookmarks);
      case 'auto':
      default:
        return this.autoCluster(bookmarks);
    }
  }


  private clusterByDate(bookmarks: BookmarkData[]): BookmarkCluster[] {
    console.log('📅 Date clustering - Input bookmarks:', bookmarks.length);
    
    const now = new Date();
    const dateGroups = new Map<string, BookmarkData[]>();

    bookmarks.forEach((bookmark, index) => {
      const bookmarkDate = new Date(bookmark.createdAt);
      const daysDiff = Math.floor((now.getTime() - bookmarkDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let dateKey: string;
      if (daysDiff === 0) {
        dateKey = 'today';
      } else if (daysDiff === 1) {
        dateKey = 'yesterday';
      } else if (daysDiff <= 7) {
        dateKey = 'this-week';
      } else if (daysDiff <= 30) {
        dateKey = 'this-month';
      } else if (daysDiff <= 90) {
        dateKey = 'this-quarter';
      } else {
        dateKey = 'older';
      }

      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey)!.push(bookmark);
      console.log(`📅 Bookmark ${index + 1} "${bookmark.title}" → ${dateKey} (${daysDiff} days old)`);
    });

    console.log(`📅 Found ${dateGroups.size} date groups:`, Array.from(dateGroups.keys()));

    const clusters: BookmarkCluster[] = [];
    let colorIndex = 0;

    const dateOrder = ['today', 'yesterday', 'this-week', 'this-month', 'this-quarter', 'older'];
    
    dateOrder.forEach(dateKey => {
      const bookmarkList = dateGroups.get(dateKey);
      console.log(`📅 Checking ${dateKey}: ${bookmarkList ? bookmarkList.length : 0} bookmarks`);
      
      if (bookmarkList && bookmarkList.length >= 1) { // Allow single-item clusters for debugging
        console.log(`📅 Creating cluster for "${dateKey}" with ${bookmarkList.length} bookmarks`);
        
        clusters.push({
          id: `date-${dateKey}`,
          title: this.getDateTitle(dateKey),
          description: `${bookmarkList.length} items saved ${this.getDateDescription(dateKey)}`,
          type: 'date',
          bookmarks: bookmarkList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
          createdAt: new Date().toISOString(),
          color: this.clusterColors[colorIndex % this.clusterColors.length],
          icon: 'time',
          metadata: {
            dateRange: dateKey,
          }
        });
        colorIndex++;
      }
    });

    console.log(`📅 Created ${clusters.length} date clusters`);
    return clusters;
  }

  private clusterByCategory(bookmarks: BookmarkData[]): BookmarkCluster[] {
    console.log('🏷️ Tag clustering - Input bookmarks:', bookmarks.length);
    
    if (bookmarks.length === 0) {
      return [];
    }
    
    const categoryGroups = new Map<string, BookmarkData[]>();
    
    // Collect all categories
    bookmarks.forEach((bookmark) => {
      if (bookmark.categories && bookmark.categories.length > 0) {
        bookmark.categories.forEach(category => {
          const normalizedCategory = category.trim();
          if (normalizedCategory) {
            if (!categoryGroups.has(normalizedCategory)) {
              categoryGroups.set(normalizedCategory, []);
            }
            categoryGroups.get(normalizedCategory)!.push(bookmark);
          }
        });
      }
    });

    console.log(`🏷️ Found ${categoryGroups.size} unique categories:`, Array.from(categoryGroups.keys()));

    const clusters: BookmarkCluster[] = [];
    let colorIndex = 0;

    categoryGroups.forEach((bookmarkList, category) => {
      if (bookmarkList.length >= 2) { // Require at least 2 bookmarks per cluster
        // Remove duplicates
        const uniqueBookmarks = Array.from(new Map(bookmarkList.map(b => [b.id, b])).values());
        
        console.log(`🏷️ Creating cluster for "${category}" with ${uniqueBookmarks.length} bookmarks`);
        
        clusters.push({
          id: `category-${category.toLowerCase().replace(/\s+/g, '-')}`,
          title: `🏷️ ${category}`,
          description: `${uniqueBookmarks.length} items tagged with ${category}`,
          type: 'category',
          bookmarks: uniqueBookmarks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
          createdAt: new Date().toISOString(),
          color: this.clusterColors[colorIndex % this.clusterColors.length],
          icon: 'pricetag',
          metadata: {
            keywords: [category],
          }
        });
        colorIndex++;
      }
    });

    console.log(`🏷️ Created ${clusters.length} tag clusters`);
    return clusters.sort((a, b) => b.bookmarks.length - a.bookmarks.length);
  }



  private autoCluster(bookmarks: BookmarkData[]): BookmarkCluster[] {
    console.log('🤖 Auto clustering - Input bookmarks:', bookmarks.length);
    
    // Combine category and date clustering intelligently
    const categoryClusters = this.clusterByCategory(bookmarks);
    const dateClusters = this.clusterByDate(bookmarks);

    console.log('🤖 Found category clusters:', categoryClusters.length);
    console.log('🤖 Found date clusters:', dateClusters.length);

    // Combine both types of clusters
    const allClusters = [
      ...categoryClusters,
      ...dateClusters,
    ];

    console.log('🤖 Total auto clusters:', allClusters.length);
    
    // Sort by relevance and size
    return allClusters.sort((a, b) => b.bookmarks.length - a.bookmarks.length);
  }


  private getDateTitle(dateKey: string): string {
    const dateTitles: { [key: string]: string } = {
      'today': 'Today',
      'yesterday': 'Yesterday',
      'this-week': 'This Week',
      'this-month': 'This Month',
      'this-quarter': 'Past 3 Months',
      'older': 'Older Bookmarks',
    };
    return dateTitles[dateKey] || dateKey;
  }

  private getDateDescription(dateKey: string): string {
    const dateDescriptions: { [key: string]: string } = {
      'today': 'today',
      'yesterday': 'yesterday',
      'this-week': 'this week',
      'this-month': 'this month',
      'this-quarter': 'in the past 3 months',
      'older': 'more than 3 months ago',
    };
    return dateDescriptions[dateKey] || dateKey;
  }
}

export const clusteringService = new ClusteringService();