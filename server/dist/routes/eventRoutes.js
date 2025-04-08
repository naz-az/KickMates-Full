"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventController_1 = require("../controllers/eventController");
const auth_1 = require("../middlewares/auth");
const upload_1 = require("../middlewares/upload");
const authUtils_1 = require("../utils/authUtils");
const validator_1 = require("../middlewares/validator");
const router = (0, express_1.Router)();
// Public routes
router.get('/', validator_1.validatePagination, eventController_1.getEvents);
router.get('/:id', validator_1.validateIdParam, eventController_1.getEventById);
// Protected routes
router.post('/', auth_1.authenticate, validator_1.validateCreateEvent, eventController_1.createEvent);
// Update event (owner only)
router.put('/:id', auth_1.authenticate, validator_1.validateIdParam, (0, authUtils_1.checkResourceOwnership)('events'), validator_1.validateUpdateEvent, eventController_1.updateEvent);
// Upload event image (owner only)
router.post('/:id/upload-image', auth_1.authenticate, validator_1.validateIdParam, (0, authUtils_1.checkResourceOwnership)('events'), upload_1.upload.single('eventImage'), eventController_1.uploadEventImage);
// Delete event (owner only)
router.delete('/:id', auth_1.authenticate, validator_1.validateIdParam, (0, authUtils_1.checkResourceOwnership)('events'), eventController_1.deleteEvent);
// Join event
router.post('/:id/join', auth_1.authenticate, eventController_1.joinEvent);
// Leave event
router.delete('/:id/leave', auth_1.authenticate, validator_1.validateIdParam, eventController_1.leaveEvent);
// Bookmark event
router.post('/:id/bookmark', auth_1.authenticate, validator_1.validateIdParam, eventController_1.bookmarkEvent);
// Add comment to event
router.post('/:id/comments', auth_1.authenticate, validator_1.validateIdParam, validator_1.validateAddComment, eventController_1.addComment);
// Delete comment (comment owner only)
router.delete('/:id/comments/:commentId', auth_1.authenticate, validator_1.validateIdParam, (0, authUtils_1.authorizeAction)('delete', 'comment', 'commentId'), eventController_1.deleteComment);
// Vote on comment
router.post('/:id/comments/:commentId/vote', auth_1.authenticate, validator_1.validateIdParam, validator_1.validateVote, eventController_1.voteComment);
// Add a debug log for the route
console.log('Event comment vote route registered: POST /:id/comments/:commentId/vote');
exports.default = router;
