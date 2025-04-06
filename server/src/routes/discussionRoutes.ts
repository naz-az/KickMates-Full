import { Router, RequestHandler } from 'express';
import { authenticate } from '../middlewares/auth';
import { 
  getDiscussions, 
  getDiscussionById,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  addComment,
  deleteComment,
  voteComment,
  voteDiscussion,
  uploadDiscussionImage
} from '../controllers/discussionController';
import { upload } from '../middlewares/upload';
import { checkResourceOwnership, authorizeAction } from '../utils/authUtils';
import { 
  validateCreateDiscussion, 
  validateUpdateDiscussion,
  validateAddComment,
  validateVote,
  validatePagination,
  validateIdParam
} from '../middlewares/validator';

const router = Router();

// Public routes
router.get('/', validatePagination, getDiscussions as RequestHandler);
router.get('/:id', validateIdParam, getDiscussionById as RequestHandler);

// Protected routes
router.post('/', authenticate, validateCreateDiscussion, createDiscussion as RequestHandler);

// Update discussion (owner only)
router.put('/:id', 
  authenticate, 
  validateIdParam,
  checkResourceOwnership('discussions'),
  validateUpdateDiscussion,
  updateDiscussion as RequestHandler
);

// Delete discussion (owner only)
router.delete('/:id', 
  authenticate, 
  validateIdParam,
  checkResourceOwnership('discussions'),
  deleteDiscussion as RequestHandler
);

// Vote on discussion
router.post('/:id/vote', 
  authenticate, 
  validateIdParam,
  validateVote,
  voteDiscussion as RequestHandler
);

// Add comment to discussion
router.post('/:id/comments', 
  authenticate, 
  validateIdParam,
  validateAddComment,
  addComment as RequestHandler
);

// Delete comment (comment owner only)
router.delete('/:id/comments/:commentId', 
  authenticate, 
  validateIdParam,
  authorizeAction('delete', 'comment', 'commentId'),
  deleteComment as RequestHandler
);

// Vote on comment
router.post('/:id/comments/:commentId/vote', 
  authenticate, 
  validateIdParam,
  validateVote,
  voteComment as RequestHandler
);

// Upload discussion image (owner only)
router.post('/:id/upload-image', 
  authenticate, 
  validateIdParam,
  checkResourceOwnership('discussions'),
  upload.single('discussionImage'), 
  uploadDiscussionImage as RequestHandler
);

export default router; 