"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const discussionController_1 = require("../controllers/discussionController");
const upload_1 = require("../middlewares/upload");
const authUtils_1 = require("../utils/authUtils");
const validator_1 = require("../middlewares/validator");
const router = (0, express_1.Router)();
// Public routes
router.get('/', validator_1.validatePagination, discussionController_1.getDiscussions);
router.get('/:id', validator_1.validateIdParam, discussionController_1.getDiscussionById);
// Protected routes
router.post('/', auth_1.authenticate, validator_1.validateCreateDiscussion, discussionController_1.createDiscussion);
// Update discussion (owner only)
router.put('/:id', auth_1.authenticate, validator_1.validateIdParam, (0, authUtils_1.checkResourceOwnership)('discussions'), validator_1.validateUpdateDiscussion, discussionController_1.updateDiscussion);
// Delete discussion (owner only)
router.delete('/:id', auth_1.authenticate, validator_1.validateIdParam, (0, authUtils_1.checkResourceOwnership)('discussions'), discussionController_1.deleteDiscussion);
// Vote on discussion
router.post('/:id/vote', auth_1.authenticate, validator_1.validateIdParam, validator_1.validateVote, discussionController_1.voteDiscussion);
// Add comment to discussion
router.post('/:id/comments', auth_1.authenticate, validator_1.validateIdParam, validator_1.validateAddComment, discussionController_1.addComment);
// Delete comment (comment owner only)
router.delete('/:id/comments/:commentId', auth_1.authenticate, validator_1.validateIdParam, (0, authUtils_1.authorizeAction)('delete', 'comment', 'commentId'), discussionController_1.deleteComment);
// Vote on comment
router.post('/:id/comments/:commentId/vote', auth_1.authenticate, validator_1.validateIdParam, validator_1.validateVote, discussionController_1.voteComment);
// Upload discussion image (owner only)
router.post('/:id/upload-image', auth_1.authenticate, validator_1.validateIdParam, (0, authUtils_1.checkResourceOwnership)('discussions'), upload_1.upload.single('discussionImage'), discussionController_1.uploadDiscussionImage);
exports.default = router;
