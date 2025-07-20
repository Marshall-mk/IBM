import { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { BookmarkService } from '../services/bookmarkService';
import { 
  APIResponse, 
  BookmarkData, 
  BookmarkFilter, 
  SearchResult, 
  RequestWithUser 
} from '../types';

const bookmarkService = new BookmarkService();

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