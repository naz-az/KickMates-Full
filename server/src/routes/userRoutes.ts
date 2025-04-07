import { Router, RequestHandler } from 'express';
import { register, login, getProfile, updateProfile, getUserEvents, getUserBookmarks, getAllUsers, getUserById, getUserEventsById, changePassword, deleteAccount, uploadProfileImage, searchUsers } from '../controllers/userController';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { 
  validateRegister, 
  validateLogin, 
  validateProfileUpdate, 
  validateChangePassword, 
  validateIdParam
} from '../middlewares/validator';

const router = Router();

// Public routes
router.post('/register', validateRegister, register as RequestHandler);
router.post('/login', validateLogin, login as RequestHandler);
router.get('/all', getAllUsers as RequestHandler);
router.get('/search', searchUsers as RequestHandler);

// Protected routes
router.get('/profile', authenticate, getProfile as RequestHandler);
router.put('/profile', authenticate, validateProfileUpdate, updateProfile as RequestHandler);
router.post('/profile/upload-image', authenticate, upload.single('profileImage'), uploadProfileImage as RequestHandler);
router.get('/events', authenticate, getUserEvents as RequestHandler);
router.get('/bookmarks', authenticate, getUserBookmarks as RequestHandler);
router.post('/change-password', authenticate, validateChangePassword, changePassword as RequestHandler);
router.post('/delete-account', authenticate, deleteAccount as RequestHandler);

// Routes with params - must come after more specific routes
router.get('/:id', validateIdParam, getUserById as RequestHandler);
router.get('/:id/events', validateIdParam, getUserEventsById as RequestHandler);

export default router; 