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
exports.socketService = void 0;
const socket_io_1 = require("socket.io");
const db_1 = require("../db");
class SocketService {
    constructor() {
        this.io = null;
        this.userSockets = {};
    }
    // Initialize socket server with HTTP server
    initialize(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: '*', // In production, set this to your frontend URL
                methods: ['GET', 'POST']
            }
        });
        this.io.on('connection', this.handleConnection.bind(this));
        console.log('Socket.IO service initialized');
    }
    // Handle new socket connections
    handleConnection(socket) {
        console.log(`New socket connection: ${socket.id}`);
        // Authenticate user
        socket.on('authenticate', (data) => {
            // In a real app, verify the token here
            this.userSockets[data.userId] = socket.id;
            console.log(`User ${data.userId} authenticated with socket ${socket.id}`);
            // Join user to their own room for private messages
            socket.join(`user:${data.userId}`);
        });
        // Handle joining a conversation room
        socket.on('join-conversation', (conversationId) => {
            socket.join(`conversation:${conversationId}`);
            console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
        });
        // Handle leaving a conversation room
        socket.on('leave-conversation', (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
            console.log(`Socket ${socket.id} left conversation ${conversationId}`);
        });
        // Handle new messages
        socket.on('send-message', (data) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { conversationId, content, senderId, replyToId } = data;
                // Get reply information if needed
                let replyToContent = null;
                let replyToSender = null;
                if (replyToId) {
                    const replyMsg = yield (0, db_1.getAsync)(`
            SELECT m.content, u.full_name as senderName
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?
          `, [replyToId]);
                    if (replyMsg) {
                        replyToContent = replyMsg.content;
                        replyToSender = replyMsg.senderName;
                    }
                }
                // Insert new message into database
                const result = yield (0, db_1.runAsync)(`
          INSERT INTO messages (conversation_id, sender_id, content, reply_to_id, reply_to_content, reply_to_sender)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [conversationId, senderId, content.trim(), replyToId || null, replyToContent, replyToSender]);
                // Get the inserted message ID
                const messageId = result.lastID;
                // Fetch the complete message with sender details
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
                const formattedMessage = {
                    id: newMessage.id,
                    senderId: newMessage.sender_id,
                    senderUsername: newMessage.sender_username,
                    senderName: newMessage.sender_name,
                    senderProfileImage: newMessage.sender_profile_image,
                    content: newMessage.content,
                    isRead: false,
                    createdAt: newMessage.created_at,
                    replyToId: newMessage.reply_to_id,
                    replyToContent: newMessage.reply_to_content,
                    replyToSender: newMessage.reply_to_sender,
                    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    date: 'Today'
                };
                // Broadcast the message to all users in the conversation
                (_a = this.io) === null || _a === void 0 ? void 0 : _a.to(`conversation:${conversationId}`).emit('new-message', formattedMessage);
                // Update conversation's updated_at timestamp
                yield (0, db_1.runAsync)(`
          UPDATE conversations
          SET updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [conversationId]);
                // Get all participants in this conversation
                const participants = yield this.getConversationParticipants(conversationId);
                // Send notification to other participants who aren't in the room
                participants.forEach(participant => {
                    var _a;
                    if (participant !== senderId.toString()) {
                        // Emit to the user's own room so they get a notification
                        (_a = this.io) === null || _a === void 0 ? void 0 : _a.to(`user:${participant}`).emit('conversation-updated', {
                            conversationId,
                            lastMessage: formattedMessage
                        });
                    }
                });
            }
            catch (error) {
                console.error('Error handling send-message event:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        }));
        // Handle message read status
        socket.on('mark-messages-read', (data) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { conversationId, userId } = data;
                yield (0, db_1.runAsync)(`
          UPDATE messages
          SET is_read = 1
          WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
        `, [conversationId, userId]);
                // Broadcast that messages were read
                (_a = this.io) === null || _a === void 0 ? void 0 : _a.to(`conversation:${conversationId}`).emit('messages-read', {
                    conversationId,
                    userId
                });
            }
            catch (error) {
                console.error('Error handling mark-messages-read event:', error);
            }
        }));
        // Handle disconnections
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
            // Remove this socket from userSockets
            for (const userId in this.userSockets) {
                if (this.userSockets[userId] === socket.id) {
                    delete this.userSockets[userId];
                    console.log(`User ${userId} disconnected`);
                    break;
                }
            }
        });
    }
    // Helper to get all participants in a conversation
    getConversationParticipants(conversationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const participants = yield this.getParticipantsFromDb(conversationId);
                return participants.map((p) => p.user_id.toString());
            }
            catch (error) {
                console.error('Error getting conversation participants:', error);
                return [];
            }
        });
    }
    // Fetch participants from database
    getParticipantsFromDb(conversationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, db_1.allAsync)(`SELECT user_id FROM conversation_participants WHERE conversation_id = ?`, [conversationId]);
        });
    }
}
// Create and export a singleton instance
exports.socketService = new SocketService();
