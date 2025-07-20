import { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { BookmarkService } from '../services/bookmarkService';
import { ContentExtractorService } from '../services/contentExtractor';
import { AIService } from '../services/aiService';
import { 
  APIResponse, 
  BookmarkData, 
  BookmarkFilter, 
  SearchResult, 
  RequestWithUser 
} from '../types';

const bookmarkService = new BookmarkService();
let aiService: AIService | null = null;

// Initialize AI service with error handling
try {
  aiService = new AIService();
} catch (error) {
  console.warn('AI service not available:', error instanceof Error ? error.message : 'Unknown error');
}

export const validateCreateBookmark = [
  body('url')
    .isURL()
    .withMessage('Please provide a valid URL'),
  body('title')
    .isLength({ min: 1 })
    .withMessage('Title is required'),
  body('content')
    .optional()
    .isLength({ max: 10000 })
    .withMessage('Content must be less than 10,000 characters'),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
];

export const validateUpdateBookmark = [
  body('title')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Title cannot be empty'),
  body('content')
    .optional()
    .isLength({ max: 10000 })
    .withMessage('Content must be less than 10,000 characters'),
  body('isRead')
    .optional()
    .isBoolean()
    .withMessage('isRead must be a boolean'),
  body('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite must be a boolean'),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
];

export const validateSearch = [
  query('q')
    .isLength({ min: 1 })
    .withMessage('Search query is required'),
  query('useAI')
    .optional()
    .isBoolean()
    .withMessage('useAI must be a boolean'),
];

export const getBookmarks = async (
  req: RequestWithUser,
  res: Response<APIResponse<{ bookmarks: BookmarkData[] }>>
): Promise<Response<APIResponse<{ bookmarks: BookmarkData[] }>> | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
    }

    const filter: BookmarkFilter = {};

    // Apply filters from query params
    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === 'true';
    }

    if (req.query.isFavorite !== undefined) {
      filter.isFavorite = req.query.isFavorite === 'true';
    }

    if (req.query.search) {
      filter.searchQuery = req.query.search as string;
    }

    if (req.query.dateRange) {
      filter.dateRange = req.query.dateRange as 'week' | 'month' | 'year' | 'all';
    }

    const bookmarks = await bookmarkService.getBookmarks(req.user.id, filter);

    res.json({
      success: true,
      data: { bookmarks },
      message: 'Bookmarks retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve bookmarks',
        code: 'BOOKMARKS_ERROR',
      },
    });
  }
};

export const getBookmark = async (
  req: RequestWithUser,
  res: Response<APIResponse<{ bookmark: BookmarkData }>>
): Promise<Response<APIResponse<{ bookmark: BookmarkData }>> | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Bookmark ID is required',
          code: 'VALIDATION_ERROR',
        },
      });
    }
    const bookmark = await bookmarkService.getBookmark(id, req.user.id);

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Bookmark not found',
          code: 'BOOKMARK_NOT_FOUND',
        },
      });
    }

    res.json({
      success: true,
      data: { bookmark },
      message: 'Bookmark retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve bookmark',
        code: 'BOOKMARK_ERROR',
      },
    });
  }
};

export const createBookmark = async (
  req: RequestWithUser,
  res: Response<APIResponse<{ bookmark: BookmarkData }>>
): Promise<Response<APIResponse<{ bookmark: BookmarkData }>> | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
    }

    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: errors.array()[0]?.msg || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array(),
        },
      });
    }

    const bookmark = await bookmarkService.createBookmark(req.user.id, req.body);

    res.status(201).json({
      success: true,
      data: { bookmark },
      message: 'Bookmark created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create bookmark',
        code: 'CREATE_BOOKMARK_ERROR',
      },
    });
  }
};

export const updateBookmark = async (
  req: RequestWithUser,
  res: Response<APIResponse<{ bookmark: BookmarkData }>>
): Promise<Response<APIResponse<{ bookmark: BookmarkData }>> | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
    }

    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: errors.array()[0]?.msg || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array(),
        },
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Bookmark ID is required',
          code: 'VALIDATION_ERROR',
        },
      });
    }
    const bookmark = await bookmarkService.updateBookmark(id, req.user.id, req.body);

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Bookmark not found',
          code: 'BOOKMARK_NOT_FOUND',
        },
      });
    }

    res.json({
      success: true,
      data: { bookmark },
      message: 'Bookmark updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update bookmark',
        code: 'UPDATE_BOOKMARK_ERROR',
      },
    });
  }
};

export const deleteBookmark = async (
  req: RequestWithUser,
  res: Response<APIResponse<null>>
): Promise<Response<APIResponse<null>> | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Bookmark ID is required',
          code: 'VALIDATION_ERROR',
        },
      });
    }
    const success = await bookmarkService.deleteBookmark(id, req.user.id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Bookmark not found',
          code: 'BOOKMARK_NOT_FOUND',
        },
      });
    }

    res.json({
      success: true,
      message: 'Bookmark deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete bookmark',
        code: 'DELETE_BOOKMARK_ERROR',
      },
    });
  }
};

export const toggleFavorite = async (
  req: RequestWithUser,
  res: Response<APIResponse<{ bookmark: BookmarkData }>>
): Promise<Response<APIResponse<{ bookmark: BookmarkData }>> | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Bookmark ID is required',
          code: 'VALIDATION_ERROR',
        },
      });
    }
    const bookmark = await bookmarkService.toggleFavorite(id, req.user.id);

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Bookmark not found',
          code: 'BOOKMARK_NOT_FOUND',
        },
      });
    }

    res.json({
      success: true,
      data: { bookmark },
      message: 'Bookmark favorite status updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to toggle favorite status',
        code: 'TOGGLE_FAVORITE_ERROR',
      },
    });
  }
};

export const markAsRead = async (
  req: RequestWithUser,
  res: Response<APIResponse<{ bookmark: BookmarkData }>>
): Promise<Response<APIResponse<{ bookmark: BookmarkData }>> | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Bookmark ID is required',
          code: 'VALIDATION_ERROR',
        },
      });
    }
    const bookmark = await bookmarkService.markAsRead(id, req.user.id);

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Bookmark not found',
          code: 'BOOKMARK_NOT_FOUND',
        },
      });
    }

    res.json({
      success: true,
      data: { bookmark },
      message: 'Bookmark marked as read successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to mark bookmark as read',
        code: 'MARK_READ_ERROR',
      },
    });
  }
};

export const searchBookmarks = async (
  req: RequestWithUser,
  res: Response<APIResponse<{ results: SearchResult[] }>>
): Promise<Response<APIResponse<{ results: SearchResult[] }>> | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
    }

    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: errors.array()[0]?.msg || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array(),
        },
      });
    }

    const query = req.query.q as string;
    const useAI = req.query.useAI === 'true';

    const results = await bookmarkService.searchBookmarks(req.user.id, query, useAI);

    res.json({
      success: true,
      data: { results },
      message: 'Search completed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to search bookmarks',
        code: 'SEARCH_ERROR',
      },
    });
  }
};

export const getCategories = async (
  req: RequestWithUser,
  res: Response<APIResponse<{ categories: string[] }>>
): Promise<Response<APIResponse<{ categories: string[] }>> | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
    }

    const categories = await bookmarkService.getCategories(req.user.id);

    res.json({
      success: true,
      data: { categories },
      message: 'Categories retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve categories',
        code: 'CATEGORIES_ERROR',
      },
    });
  }
};

export const bulkDelete = async (
  req: RequestWithUser,
  res: Response<APIResponse<{ deletedCount: number }>>
): Promise<Response<APIResponse<{ deletedCount: number }>> | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
    }

    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'IDs array is required and cannot be empty',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    const deletedCount = await bookmarkService.bulkDelete(ids, req.user.id);

    res.json({
      success: true,
      data: { deletedCount },
      message: `${deletedCount} bookmarks deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete bookmarks',
        code: 'BULK_DELETE_ERROR',
      },
    });
  }
};

// AI Summarization validation
export const validateSummaryRequest = [
  body('bookmarkIds')
    .isArray({ min: 1 })
    .withMessage('At least one bookmark ID is required'),
  body('bookmarkIds.*')
    .isString()
    .withMessage('All bookmark IDs must be strings'),
  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object'),
  body('options.maxLength')
    .optional()
    .isInt({ min: 100, max: 2000 })
    .withMessage('Max length must be between 100 and 2000 words'),
  body('options.style')
    .optional()
    .isIn(['brief', 'detailed', 'bullet-points'])
    .withMessage('Style must be brief, detailed, or bullet-points'),
];

// AI Summarization endpoint
export const generateSummary = async (
  req: RequestWithUser,
  res: Response<APIResponse<{ summary: BookmarkData }>>
): Promise<Response<APIResponse<{ summary: BookmarkData }>> | void> => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
    }

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array(),
        },
      });
    }

    // Get user's API key from request body or header
    const userApiKey = req.body.apiKey || req.headers['x-openai-api-key'] as string;
    
    // Try to create AI service with user's key or fallback to default
    let activeAIService: AIService | null = null;
    
    if (userApiKey) {
      try {
        activeAIService = AIService.withApiKey(userApiKey);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid OpenAI API key provided. Please check your API key format.',
            code: 'INVALID_API_KEY',
          },
        });
      }
    } else if (aiService) {
      activeAIService = aiService;
    } else {
      return res.status(400).json({
        success: false,
        error: {
          message: 'OpenAI API key required. Please provide your API key to use AI summarization.',
          code: 'API_KEY_REQUIRED',
        },
      });
    }

    const { bookmarkIds, options = {} } = req.body;

    // Fetch bookmarks from database
    const bookmarks = await Promise.all(
      bookmarkIds.map((id: string) => bookmarkService.getBookmark(id, req.user!.id))
    );

    // Filter out null bookmarks (not found or not owned by user)
    const validBookmarks = bookmarks.filter((bookmark): bookmark is BookmarkData => 
      bookmark !== null
    );

    if (validBookmarks.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'No valid bookmarks found',
          code: 'BOOKMARKS_NOT_FOUND',
        },
      });
    }

    // Use a hybrid approach: extract content via API service, then analyze with AI
    const extractedContents = await Promise.allSettled(
      validBookmarks.map(async (bookmark) => {
        try {
          // Try to extract content using a web service API
          const content = await extractContentViaAPI(bookmark.url, bookmark.title);
          return content;
        } catch (error) {
          console.warn(`Failed to extract content from ${bookmark.url}:`, error);
          throw error;
        }
      })
    );

    // Process successful extractions
    const successfulExtractions = extractedContents
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);

    if (successfulExtractions.length === 0) {
      return res.status(422).json({
        success: false,
        error: {
          message: `Could not extract readable content from any of the ${validBookmarks.length} URLs. Please ensure the URLs contain accessible text content.`,
          code: 'CONTENT_EXTRACTION_FAILED',
        },
      });
    }

    console.log(`Successfully extracted content from ${successfulExtractions.length} out of ${validBookmarks.length} URLs`);

    // Generate AI summary using the extracted content
    const summaryResponse = await activeAIService.generateSummary({
      urls: successfulExtractions.map(c => c.url),
      titles: successfulExtractions.map(c => c.title),
      contents: successfulExtractions,
      options,
    });

    // Create a new bookmark for the summary
    const summaryTitle = validBookmarks.length === 1 
      ? `Summary: ${validBookmarks[0]?.title || 'Article'}`
      : `Summary of ${validBookmarks.length} articles`;

    // Create categories and date that will group the summary with the source cluster
    // For category clusters: use all unique categories from source bookmarks
    const allSourceCategories = validBookmarks.flatMap(b => b.categories || []);
    const uniqueSourceCategories = [...new Set(allSourceCategories)];
    const summaryCategories = ['ai-summary', ...uniqueSourceCategories];

    // For date clusters: use the most recent bookmark's creation date to ensure clustering
    const mostRecentBookmark = validBookmarks.reduce((latest, current) => {
      return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
    });

    const summaryBookmark = await bookmarkService.createBookmarkWithDate(req.user!.id, {
      url: `intellimark://summary/${Date.now()}`,
      title: summaryTitle,
      content: summaryResponse.summary,
      categories: summaryCategories,
    }, mostRecentBookmark.createdAt.toString()); // Use source bookmark's date for clustering

    res.json({
      success: true,
      data: { summary: summaryBookmark },
      message: `AI summary generated successfully from ${validBookmarks.length} articles using direct web access`,
    });

  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to generate summary',
        code: 'SUMMARY_GENERATION_ERROR',
      },
    });
  }

};

// Helper function to extract content using a web API service
async function extractContentViaAPI(url: string, title: string): Promise<any> {
  try {
    // Use Jina AI Reader API for content extraction
    const response = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'IntelliMark/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();
    
    if (content.length < 200) {
      throw new Error('Insufficient content extracted');
    }

    return {
      url,
      title,
      content: content.slice(0, 8000), // Limit to 8000 characters
      wordCount: content.split(' ').length,
    };
  } catch (error) {
    throw new Error(`Content extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}