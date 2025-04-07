import express, { RequestHandler } from 'express';
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  createConversation,
  getConversation,
  deleteMessage,
  likeMessage,
  unlikeMessage
} from '../controllers/messageController';
import { authenticate } from '../middlewares/auth';
import { checkConversationParticipation, authorizeAction } from '../utils/authUtils';
import {
  validateSendMessage,
  validateCreateConversation,
  validateIdParam,
  validatePagination
} from '../middlewares/validator';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all conversations for current user
router.get('/conversations', validatePagination, getConversations as RequestHandler);

// Create a new conversation
router.post('/conversations', validateCreateConversation, createConversation as RequestHandler);

// Get a specific conversation
router.get(
  '/conversations/:conversationId', 
  checkConversationParticipation('conversationId'),
  getConversation as RequestHandler
);

// Get messages for a specific conversation
router.get(
  '/conversations/:conversationId/messages', 
  validatePagination,
  checkConversationParticipation('conversationId'),
  getMessages as RequestHandler
);

// Send a message to a conversation
router.post(
  '/conversations/:conversationId/messages', 
  checkConversationParticipation('conversationId'),
  validateSendMessage,
  sendMessage as RequestHandler
);

// Delete a message from a conversation (only owner can delete)
router.delete(
  '/conversations/:conversationId/messages/:messageId', 
  checkConversationParticipation('conversationId'),
  authorizeAction('delete', 'message', 'messageId'),
  deleteMessage as RequestHandler
);

// Like a message
router.post(
  '/conversations/:conversationId/messages/:messageId/like',
  checkConversationParticipation('conversationId'),
  likeMessage as RequestHandler
);

// Unlike a message
router.delete(
  '/conversations/:conversationId/messages/:messageId/like',
  checkConversationParticipation('conversationId'),
  unlikeMessage as RequestHandler
);

export default router; 