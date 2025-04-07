"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middlewares/auth");
const upload_1 = require("../middlewares/upload");
const validator_1 = require("../middlewares/validator");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', validator_1.validateRegister, userController_1.register);
router.post('/login', validator_1.validateLogin, userController_1.login);
router.get('/all', userController_1.getAllUsers);
router.get('/search', userController_1.searchUsers);
// Protected routes
router.get('/profile', auth_1.authenticate, userController_1.getProfile);
router.put('/profile', auth_1.authenticate, validator_1.validateProfileUpdate, userController_1.updateProfile);
router.post('/profile/upload-image', auth_1.authenticate, upload_1.upload.single('profileImage'), userController_1.uploadProfileImage);
router.get('/events', auth_1.authenticate, userController_1.getUserEvents);
router.get('/bookmarks', auth_1.authenticate, userController_1.getUserBookmarks);
router.post('/change-password', auth_1.authenticate, validator_1.validateChangePassword, userController_1.changePassword);
router.post('/delete-account', auth_1.authenticate, userController_1.deleteAccount);
// Routes with params - must come after more specific routes
router.get('/:id', validator_1.validateIdParam, userController_1.getUserById);
router.get('/:id/events', validator_1.validateIdParam, userController_1.getUserEventsById);
exports.default = router;
