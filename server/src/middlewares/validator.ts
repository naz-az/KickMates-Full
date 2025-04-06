import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Custom validation middleware to check validation results
export const validateRequest: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
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

// Helper function that wraps middleware in an array
export const validate = (validations: ValidationChain[]): RequestHandler[] => {
  return [
    ...validations as RequestHandler[],
    validateRequest
  ];
};

// User validation
export const registerValidationRules = [
  body('username')
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('full_name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('bio')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
];

export const loginValidationRules = [
  body('email')
    .isString()
    .withMessage('Email or username is required'),
  body('password')
    .isString()
    .withMessage('Password is required')
];

export const profileUpdateValidationRules = [
  body('username')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('full_name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('bio')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
];

export const changePasswordValidationRules = [
  body('currentPassword')
    .isString()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// Event validation
export const createEventValidationRules = [
  body('title')
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .isString()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('location')
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Location must be between 3 and 100 characters'),
  body('event_date')
    .isDate()
    .withMessage('Invalid event date format'),
  body('event_time')
    .isString()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)'),
  body('sport_type')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Sport type must be between 2 and 50 characters'),
  body('max_participants')
    .optional()
    .isInt({ min: 2 })
    .withMessage('Maximum participants must be at least 2'),
  body('skill_level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Any'])
    .withMessage('Invalid skill level')
];

export const updateEventValidationRules = [
  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('location')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Location must be between 3 and 100 characters'),
  body('event_date')
    .optional()
    .isDate()
    .withMessage('Invalid event date format'),
  body('event_time')
    .optional()
    .isString()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)'),
  body('sport_type')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Sport type must be between 2 and 50 characters'),
  body('max_participants')
    .optional()
    .isInt({ min: 2 })
    .withMessage('Maximum participants must be at least 2'),
  body('skill_level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Any'])
    .withMessage('Invalid skill level')
];

// Discussion validation
export const createDiscussionValidationRules = [
  body('title')
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('content')
    .isString()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Content must be between 10 and 5000 characters'),
  body('category')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

export const updateDiscussionValidationRules = [
  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('content')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Content must be between 10 and 5000 characters'),
  body('category')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

// Comment validation
export const addCommentValidationRules = [
  body('content')
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
];

// Message validation
export const sendMessageValidationRules = [
  body('content')
    .isString()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  body('replyToId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid reply message ID')
];

export const createConversationValidationRules = [
  body('participants')
    .isArray({ min: 1 })
    .withMessage('At least one participant is required'),
  body('participants.*')
    .isInt({ min: 1 })
    .withMessage('All participant IDs must be valid')
];

// Vote validation
export const voteValidationRules = [
  body('voteType')
    .isIn(['up', 'down'])
    .withMessage('Vote type must be "up" or "down"')
];

// Pagination and filtering validation for GET requests
export const paginationValidationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// ID parameter validation
export const idParamValidationRules = [
  param('id')
    .custom((value) => {
      // Allow both string numeric IDs and integer IDs
      const id = parseInt(value, 10);
      if (isNaN(id) || id < 1) {
        throw new Error('ID must be a positive integer');
      }
      return true;
    })
];

// For backward compatibility
export const validateRegister = validate(registerValidationRules);
export const validateLogin = validate(loginValidationRules);
export const validateProfileUpdate = validate(profileUpdateValidationRules);
export const validateChangePassword = validate(changePasswordValidationRules);
export const validateCreateEvent = validate(createEventValidationRules);
export const validateUpdateEvent = validate(updateEventValidationRules);
export const validateCreateDiscussion = validate(createDiscussionValidationRules);
export const validateUpdateDiscussion = validate(updateDiscussionValidationRules);
export const validateAddComment = validate(addCommentValidationRules);
export const validateSendMessage = validate(sendMessageValidationRules);
export const validateCreateConversation = validate(createConversationValidationRules);
export const validateVote = validate(voteValidationRules);
export const validatePagination = validate(paginationValidationRules);
export const validateIdParam = validate(idParamValidationRules); 