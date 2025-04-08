"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateIdParam = exports.validatePagination = exports.validateVote = exports.validateCreateConversation = exports.validateSendMessage = exports.validateAddComment = exports.validateUpdateDiscussion = exports.validateCreateDiscussion = exports.validateUpdateEvent = exports.validateCreateEvent = exports.validateChangePassword = exports.validateProfileUpdate = exports.validateLogin = exports.validateRegister = exports.idParamValidationRules = exports.paginationValidationRules = exports.voteValidationRules = exports.createConversationValidationRules = exports.sendMessageValidationRules = exports.addCommentValidationRules = exports.updateDiscussionValidationRules = exports.createDiscussionValidationRules = exports.updateEventValidationRules = exports.createEventValidationRules = exports.changePasswordValidationRules = exports.profileUpdateValidationRules = exports.loginValidationRules = exports.registerValidationRules = exports.validate = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
// Custom validation middleware to check validation results
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        console.log('Validation error details:', JSON.stringify(errors.array()));
        console.log('Request params:', req.params);
        console.log('Request body:', req.body);
        console.log('Request query:', req.query);
        res.status(400).json({ errors: errors.array() });
        return;
    }
    next();
};
exports.validateRequest = validateRequest;
// Helper function that wraps middleware in an array
const validate = (validations) => {
    return [
        ...validations,
        exports.validateRequest
    ];
};
exports.validate = validate;
// User validation
exports.registerValidationRules = [
    (0, express_validator_1.body)('username')
        .isString()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('full_name')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('bio')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters')
];
exports.loginValidationRules = [
    (0, express_validator_1.body)('email')
        .isString()
        .withMessage('Email or username is required'),
    (0, express_validator_1.body)('password')
        .isString()
        .withMessage('Password is required')
];
exports.profileUpdateValidationRules = [
    (0, express_validator_1.body)('username')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('full_name')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('bio')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters')
];
exports.changePasswordValidationRules = [
    (0, express_validator_1.body)('currentPassword')
        .isString()
        .withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
];
// Event validation
exports.createEventValidationRules = [
    (0, express_validator_1.body)('title')
        .isString()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters'),
    (0, express_validator_1.body)('description')
        .isString()
        .trim()
        .isLength({ min: 10, max: 5000 })
        .withMessage('Description must be between 10 and 5000 characters'),
    (0, express_validator_1.body)('location')
        .isString()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Location must be between 3 and 100 characters'),
    (0, express_validator_1.body)('start_date')
        .isString()
        .withMessage('Invalid start date format'),
    (0, express_validator_1.body)('end_date')
        .isString()
        .withMessage('Invalid end date format'),
    (0, express_validator_1.body)('sport_type')
        .isString()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Sport type must be between 2 and 50 characters'),
    (0, express_validator_1.body)('max_players')
        .isInt({ min: 2 })
        .withMessage('Maximum players must be at least 2'),
    (0, express_validator_1.body)('image_url')
        .optional()
        .isString()
        .withMessage('Invalid image URL')
];
exports.updateEventValidationRules = [
    (0, express_validator_1.body)('title')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 10, max: 5000 })
        .withMessage('Description must be between 10 and 5000 characters'),
    (0, express_validator_1.body)('location')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Location must be between 3 and 100 characters'),
    (0, express_validator_1.body)('start_date')
        .optional()
        .isString()
        .withMessage('Invalid start date format'),
    (0, express_validator_1.body)('end_date')
        .optional()
        .isString()
        .withMessage('Invalid end date format'),
    (0, express_validator_1.body)('sport_type')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Sport type must be between 2 and 50 characters'),
    (0, express_validator_1.body)('max_players')
        .optional()
        .isInt({ min: 2 })
        .withMessage('Maximum players must be at least 2'),
    (0, express_validator_1.body)('image_url')
        .optional()
        .isString()
        .withMessage('Invalid image URL')
];
// Discussion validation
exports.createDiscussionValidationRules = [
    (0, express_validator_1.body)('title')
        .isString()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters'),
    (0, express_validator_1.body)('content')
        .isString()
        .trim()
        .isLength({ min: 10, max: 5000 })
        .withMessage('Content must be between 10 and 5000 characters'),
    (0, express_validator_1.body)('category')
        .isString()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Category must be between 2 and 50 characters'),
    (0, express_validator_1.body)('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array')
];
exports.updateDiscussionValidationRules = [
    (0, express_validator_1.body)('title')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters'),
    (0, express_validator_1.body)('content')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 10, max: 5000 })
        .withMessage('Content must be between 10 and 5000 characters'),
    (0, express_validator_1.body)('category')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Category must be between 2 and 50 characters'),
    (0, express_validator_1.body)('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array')
];
// Comment validation
exports.addCommentValidationRules = [
    (0, express_validator_1.body)('content')
        .isString()
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comment must be between 1 and 1000 characters')
];
// Message validation
exports.sendMessageValidationRules = [
    (0, express_validator_1.body)('content')
        .isString()
        .trim()
        .isLength({ min: 1, max: 2000 })
        .withMessage('Message must be between 1 and 2000 characters'),
    (0, express_validator_1.body)('replyToId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Invalid reply message ID')
];
exports.createConversationValidationRules = [
    (0, express_validator_1.body)()
        .custom((value, { req }) => {
        // Check if either participants or participantIds is provided
        const { participants, participantIds } = req.body;
        const userIds = participants || participantIds;
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            throw new Error('At least one participant is required (participants or participantIds)');
        }
        // Validate each participant ID
        for (const id of userIds) {
            const numId = Number(id);
            if (isNaN(numId) || numId < 1 || !Number.isInteger(numId)) {
                throw new Error('All participant IDs must be valid integers');
            }
        }
        return true;
    })
];
// Vote validation
exports.voteValidationRules = [
    (0, express_validator_1.body)('voteType')
        .isIn(['up', 'down'])
        .withMessage('Vote type must be "up" or "down"')
];
// Pagination and filtering validation for GET requests
exports.paginationValidationRules = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];
// ID parameter validation
exports.idParamValidationRules = [
    (0, express_validator_1.param)('id')
        .custom((value) => {
        // Allow both string numeric IDs and integer IDs
        const id = parseInt(value, 10);
        if (isNaN(id) || id < 1) {
            throw new Error('ID must be a positive integer');
        }
        return true;
    }),
    (0, express_validator_1.param)('commentId')
        .optional()
        .custom((value) => {
        // Allow both string numeric IDs and integer IDs
        const id = parseInt(value, 10);
        if (isNaN(id) || id < 1) {
            throw new Error('Comment ID must be a positive integer');
        }
        return true;
    })
];
// For backward compatibility
exports.validateRegister = (0, exports.validate)(exports.registerValidationRules);
exports.validateLogin = (0, exports.validate)(exports.loginValidationRules);
exports.validateProfileUpdate = (0, exports.validate)(exports.profileUpdateValidationRules);
exports.validateChangePassword = (0, exports.validate)(exports.changePasswordValidationRules);
exports.validateCreateEvent = (0, exports.validate)(exports.createEventValidationRules);
exports.validateUpdateEvent = (0, exports.validate)(exports.updateEventValidationRules);
exports.validateCreateDiscussion = (0, exports.validate)(exports.createDiscussionValidationRules);
exports.validateUpdateDiscussion = (0, exports.validate)(exports.updateDiscussionValidationRules);
exports.validateAddComment = (0, exports.validate)(exports.addCommentValidationRules);
exports.validateSendMessage = (0, exports.validate)(exports.sendMessageValidationRules);
exports.validateCreateConversation = (0, exports.validate)(exports.createConversationValidationRules);
exports.validateVote = (0, exports.validate)(exports.voteValidationRules);
exports.validatePagination = (0, exports.validate)(exports.paginationValidationRules);
exports.validateIdParam = (0, exports.validate)(exports.idParamValidationRules);
