import { Router } from 'express';
import {
  getBookmarks,
  getBookmark,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  toggleFavorite,
  markAsRead,
  searchBookmarks,
  getCategories,
  bulkDelete,
  validateCreateBookmark,
  validateUpdateBookmark,
  validateSearch,
  generateSummary,
  validateSummaryRequest,
} from '../controllers/bookmarkController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All bookmark routes require authentication
router.use(authenticateToken);

// Bookmark CRUD operations
router.get('/', getBookmarks);
router.get('/search', validateSearch, searchBookmarks);
router.get('/categories', getCategories);
router.get('/:id', getBookmark);
router.post('/', validateCreateBookmark, createBookmark);
router.put('/:id', validateUpdateBookmark, updateBookmark);
router.delete('/:id', deleteBookmark);

// Special actions
router.patch('/:id/favorite', toggleFavorite);
router.patch('/:id/read', markAsRead);
router.post('/bulk-delete', bulkDelete);

// AI features
router.post('/ai-summarize', validateSummaryRequest, generateSummary);

export default router;