"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const messageController_1 = require("../controllers/messageController");
const auth_1 = require("../middlewares/auth");
const authUtils_1 = require("../utils/authUtils");
const validator_1 = require("../middlewares/validator");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_1.authenticate);
// Get all conversations for current user
router.get('/conversations', validator_1.validatePagination, messageController_1.getConversations);
// Create a new conversation
router.post('/conversations', validator_1.validateCreateConversation, messageController_1.createConversation);
// Get a specific conversation
router.get('/conversations/:conversationId', (0, authUtils_1.checkConversationParticipation)('conversationId'), messageController_1.getConversation);
// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', validator_1.validatePagination, (0, authUtils_1.checkConversationParticipation)('conversationId'), messageController_1.getMessages);
// Send a message to a conversation
router.post('/conversations/:conversationId/messages', (0, authUtils_1.checkConversationParticipation)('conversationId'), validator_1.validateSendMessage, messageController_1.sendMessage);
// Delete a message from a conversation (only owner can delete)
router.delete('/conversations/:conversationId/messages/:messageId', (0, authUtils_1.checkConversationParticipation)('conversationId'), (0, authUtils_1.authorizeAction)('delete', 'message', 'messageId'), messageController_1.deleteMessage);
exports.default = router;
