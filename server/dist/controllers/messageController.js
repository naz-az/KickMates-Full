"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.getConversation = exports.createConversation = exports.sendMessage = exports.getMessages = exports.getConversations = void 0;
const db_1 = require("../db");
// Get conversations for the current user
const getConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        // Get all conversations the user is participating in
        const conversations = yield (0, db_1.allAsync)(`
      SELECT 
        c.id, 
        c.created_at, 
        c.updated_at
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = ?
      ORDER BY c.updated_at DESC
    `, [userId]);
        // For each conversation, get the other participants and latest message
        const conversationsWithDetails = yield Promise.all(conversations.map((conversation) => __awaiter(void 0, void 0, void 0, function* () {
            // Get participants
            const participants = yield (0, db_1.allAsync)(`
          SELECT 
            u.id, 
            u.username, 
            u.full_name, 
            u.profile_image
          FROM users u
          JOIN conversation_participants cp ON u.id = cp.user_id
          WHERE cp.conversation_id = ? AND u.id != ?
        `, [conversation.id, userId]);
            // Get latest message
            const latestMessage = yield (0, db_1.getAsync)(`
          SELECT 
            m.id, 
            m.sender_id, 
            m.content, 
            m.is_read, 
            m.created_at,
            u.username as sender_username
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.conversation_id = ?
          ORDER BY m.created_at DESC
          LIMIT 1
        `, [conversation.id]);
            // Get unread count
            const unreadCount = yield (0, db_1.getAsync)(`
          SELECT COUNT(*) as count
          FROM messages
          WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
        `, [conversation.id, userId]);
            // Format the time for display
            let displayTime = '';
            let fullDate = '';
            if (latestMessage) {
                const messageDate = new Date(latestMessage.created_at);
                const now = new Date();
                const diffMs = now.getTime() - messageDate.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);
                fullDate = messageDate.toISOString();
                if (diffMins < 1) {
                    displayTime = 'Just now';
                }
                else if (diffMins < 60) {
                    displayTime = `${diffMins} mins ago`;
                }
                else if (diffHours < 24) {
                    displayTime = `${diffHours} hours ago`;
                }
                else if (diffDays === 1) {
                    displayTime = 'Yesterday';
                }
                else if (diffDays < 7) {
                    displayTime = `${diffDays} days ago`;
                }
                else {
                    displayTime = messageDate.toLocaleDateString();
                }
            }
            return {
                id: conversation.id,
                participants,
                lastMessage: latestMessage ? {
                    id: latestMessage.id,
                    senderId: latestMessage.sender_id,
                    senderUsername: latestMessage.sender_username,
                    content: latestMessage.content,
                    isRead: Boolean(latestMessage.is_read),
                    createdAt: latestMessage.created_at,
                    fullDate,
                    displayTime
                } : null,
                unreadCount: unreadCount ? unreadCount.count : 0,
                createdAt: conversation.created_at,
                updatedAt: conversation.updated_at
            };
        })));
        res.json({ conversations: conversationsWithDetails });
    }
    catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({ message: 'Server error while fetching conversations' });
    }
});
exports.getConversations = getConversations;
// Get messages for a specific conversation
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        // Check if user is a participant in this conversation
        const participant = yield (0, db_1.getAsync)(`
      SELECT * FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);
        if (!participant) {
            return res.status(403).json({ message: 'You are not a participant in this conversation' });
        }
        // Get messages
        const messages = yield (0, db_1.allAsync)(`
      SELECT 
        m.id, 
        m.sender_id, 
        m.content, 
        m.is_read, 
        m.created_at,
        m.reply_to_id,
        m.reply_to_content,
        m.reply_to_sender,
        u.username as sender_username,
        u.full_name as sender_name,
        u.profile_image as sender_profile_image
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `, [conversationId]);
        // Log the raw messages retrieved from DB
        // console.log('Raw messages fetched from DB:', messages);
        // Mark messages as read
        yield (0, db_1.runAsync)(`
      UPDATE messages
      SET is_read = 1
      WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
    `, [conversationId, userId]);
        // Format messages with date grouping
        const formattedMessages = messages.map((message) => {
            const date = new Date(message.created_at);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            let dateGroup;
            if (date.toDateString() === today.toDateString()) {
                dateGroup = 'Today';
            }
            else if (date.toDateString() === yesterday.toDateString()) {
                dateGroup = 'Yesterday';
            }
            else {
                dateGroup = date.toLocaleDateString();
            }
            return {
                id: message.id,
                senderId: message.sender_id,
                senderUsername: message.sender_username,
                senderName: message.sender_name,
                senderProfileImage: message.sender_profile_image,
                content: message.content,
                isRead: Boolean(message.is_read),
                createdAt: message.created_at,
                replyToId: message.reply_to_id,
                replyToContent: message.reply_to_content,
                replyToSender: message.reply_to_sender,
                time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                date: dateGroup
            };
        });
        res.json({ messages: formattedMessages });
    }
    catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ message: 'Server error while fetching messages' });
    }
});
exports.getMessages = getMessages;
// Send a new message
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const { content, replyToId } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Message content is required' });
        }
        // Check if user is a participant in this conversation
        const participant = yield (0, db_1.getAsync)(`
      SELECT * FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);
        if (!participant) {
            return res.status(403).json({ message: 'You are not a participant in this conversation' });
        }
        // Fetch reply context if replyToId is provided
        let replyToContent = null;
        let replyToSender = null;
        if (replyToId) {
            const originalMessage = yield (0, db_1.getAsync)(`
        SELECT m.content, u.full_name as senderName
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ? AND m.conversation_id = ?
      `, [replyToId, conversationId]);
            if (originalMessage) {
                replyToContent = originalMessage.content;
                replyToSender = originalMessage.senderName;
            }
            else {
                console.warn(`Original message for reply (ID: ${replyToId}) not found or not in the same conversation.`);
            }
        }
        // Insert the new message
        const result = yield (0, db_1.runAsync)(`
      INSERT INTO messages (conversation_id, sender_id, content, reply_to_id, reply_to_content, reply_to_sender)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [conversationId, userId, content.trim(), replyToId || null, replyToContent, replyToSender]);
        // Get the inserted message ID
        const messageId = result.lastID;
        // Update the conversation's updated_at timestamp
        yield (0, db_1.runAsync)(`
      UPDATE conversations
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [conversationId]);
        // Fetch the complete message with sender info
        const newMessage = yield (0, db_1.getAsync)(`
      SELECT 
        m.id, 
        m.sender_id, 
        m.content, 
        m.is_read, 
        m.created_at,
        m.reply_to_id,
        m.reply_to_content,
        m.reply_to_sender,
        u.username as sender_username,
        u.full_name as sender_name,
        u.profile_image as sender_profile_image
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [messageId]);
        // Format the message
        const date = new Date(newMessage.created_at);
        const today = new Date();
        let dateGroup;
        if (date.toDateString() === today.toDateString()) {
            dateGroup = 'Today';
        }
        else {
            dateGroup = date.toLocaleDateString();
        }
        const formattedMessage = {
            id: newMessage.id,
            senderId: newMessage.sender_id,
            senderUsername: newMessage.sender_username,
            senderName: newMessage.sender_name,
            senderProfileImage: newMessage.sender_profile_image,
            content: newMessage.content,
            isRead: Boolean(newMessage.is_read),
            createdAt: newMessage.created_at,
            replyToId: newMessage.reply_to_id,
            replyToContent: newMessage.reply_to_content,
            replyToSender: newMessage.reply_to_sender,
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: dateGroup
        };
        // Return success response
        res.status(201).json({
            message: 'Message sent successfully',
            data: formattedMessage
        });
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error while sending message' });
    }
});
exports.sendMessage = sendMessage;
// Create a new conversation
const createConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { participantIds } = req.body;
        if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
            return res.status(400).json({ message: 'At least one participant is required' });
        }
        // Add current user to participants if not already included
        if (!participantIds.includes(userId)) {
            participantIds.push(userId);
        }
        // Check if all participants exist
        for (const participantId of participantIds) {
            const user = yield (0, db_1.getAsync)(`SELECT id FROM users WHERE id = ?`, [participantId]);
            if (!user) {
                return res.status(404).json({ message: `User with ID ${participantId} not found` });
            }
        }
        // Check if a conversation with exactly these participants already exists
        if (participantIds.length === 2) {
            const existingConversation = yield (0, db_1.getAsync)(`
        SELECT c.id
        FROM conversations c
        WHERE (
          SELECT COUNT(*) FROM conversation_participants
          WHERE conversation_id = c.id
        ) = 2
        AND EXISTS (
          SELECT 1 FROM conversation_participants
          WHERE conversation_id = c.id AND user_id = ?
        )
        AND EXISTS (
          SELECT 1 FROM conversation_participants
          WHERE conversation_id = c.id AND user_id = ?
        )
      `, [participantIds[0], participantIds[1]]);
            if (existingConversation) {
                // Return existing conversation
                return res.json({ conversationId: existingConversation.id });
            }
        }
        // Create new conversation
        const conversationResult = yield (0, db_1.runAsync)(`
      INSERT INTO conversations DEFAULT VALUES
    `);
        const conversationId = conversationResult.lastID;
        // Add participants
        for (const participantId of participantIds) {
            yield (0, db_1.runAsync)(`
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES (?, ?)
      `, [conversationId, participantId]);
        }
        res.status(201).json({ conversationId });
    }
    catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ message: 'Server error while creating conversation' });
    }
});
exports.createConversation = createConversation;
// Get conversation details
const getConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        // Check if user is a participant in this conversation
        const participant = yield (0, db_1.getAsync)(`
      SELECT * FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);
        if (!participant) {
            return res.status(403).json({ message: 'You are not a participant in this conversation' });
        }
        // Get conversation details
        const conversation = yield (0, db_1.getAsync)(`
      SELECT id, created_at, updated_at
      FROM conversations
      WHERE id = ?
    `, [conversationId]);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }
        // Get participants
        const participants = yield (0, db_1.allAsync)(`
      SELECT 
        u.id, 
        u.username, 
        u.full_name, 
        u.profile_image
      FROM users u
      JOIN conversation_participants cp ON u.id = cp.user_id
      WHERE cp.conversation_id = ?
    `, [conversationId]);
        res.json({
            conversation: {
                id: conversation.id,
                participants,
                createdAt: conversation.created_at,
                updatedAt: conversation.updated_at
            }
        });
    }
    catch (error) {
        console.error('Error getting conversation details:', error);
        res.status(500).json({ message: 'Server error while fetching conversation details' });
    }
});
exports.getConversation = getConversation;
// Delete a message
const deleteMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { conversationId, messageId } = req.params;
        // First verify the user is a participant in this conversation
        const participant = yield (0, db_1.getAsync)(`
      SELECT * FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);
        if (!participant) {
            return res.status(403).json({ message: 'You are not a participant in this conversation' });
        }
        // Check if the message exists and belongs to the user
        const message = yield (0, db_1.getAsync)(`
      SELECT * FROM messages
      WHERE id = ? AND conversation_id = ?
    `, [messageId, conversationId]);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        // Verify the user is the sender of the message
        if (message.sender_id !== userId) {
            return res.status(403).json({ message: 'You can only delete your own messages' });
        }
        // Delete the message
        yield (0, db_1.runAsync)(`
      DELETE FROM messages
      WHERE id = ? AND sender_id = ?
    `, [messageId, userId]);
        // Return success
        res.json({ message: 'Message deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Server error while deleting message' });
    }
});
exports.deleteMessage = deleteMessage;
