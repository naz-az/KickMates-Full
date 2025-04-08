import { Router, RequestHandler } from 'express';
import { 
  createEvent, 
  getEvents, 
  getEventById, 
  updateEvent, 
  deleteEvent, 
  joinEvent, 
  leaveEvent, 
  bookmarkEvent, 
  addComment, 
  deleteComment,
  voteComment,
  uploadEventImage
} from '../controllers/eventController';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { checkResourceOwnership, authorizeAction } from '../utils/authUtils';
import { 
  validateCreateEvent, 
  validateUpdateEvent, 
  validateAddComment, 
  validateVote, 
  validatePagination, 
  validateIdParam
} from '../middlewares/validator';

const router = Router();

// Public routes
router.get('/', validatePagination, getEvents as RequestHandler);
router.get('/:id', validateIdParam, getEventById as RequestHandler);

// Protected routes
router.post('/', authenticate, validateCreateEvent, createEvent as RequestHandler);

// Update event (owner only)
router.put('/:id', 
  authenticate, 
  validateIdParam,
  checkResourceOwnership('events'),
  validateUpdateEvent,
  updateEvent as RequestHandler
);

// Upload event image (owner only)
router.post('/:id/upload-image', 
  authenticate, 
  validateIdParam,
  checkResourceOwnership('events'),
  upload.single('eventImage'), 
  uploadEventImage as RequestHandler
);

// Delete event (owner only)
router.delete('/:id', 
  authenticate, 
  validateIdParam,
  checkResourceOwnership('events'),
  deleteEvent as RequestHandler
);

// Join event
router.post('/:id/join', 
  authenticate, 
  joinEvent as RequestHandler
);

// Leave event
router.delete('/:id/leave', 
  authenticate, 
  validateIdParam,
  leaveEvent as RequestHandler
);

// Bookmark event
router.post('/:id/bookmark', 
  authenticate, 
  validateIdParam,
  bookmarkEvent as RequestHandler
);

// Add comment to event
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

// Add a debug log for the route
console.log('Event comment vote route registered: POST /:id/comments/:commentId/vote');

export default router; 