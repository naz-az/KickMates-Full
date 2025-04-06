import { Router, RequestHandler } from 'express';
import { 
  getTopCourses,
  getUserCourses,
  getUserStatistics,
  getProductivityData,
  getUpcomingEvents
} from '../controllers/dashboardController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Get top recommended events
router.get('/top-events', getTopCourses as RequestHandler);

// Get user events
router.get('/user-events', getUserCourses as RequestHandler);

// Get user statistics
router.get('/statistics', getUserStatistics as RequestHandler);

// Get activity data
router.get('/activity', getProductivityData as RequestHandler);

// Get upcoming events
router.get('/upcoming-events', getUpcomingEvents as RequestHandler);

export default router; 