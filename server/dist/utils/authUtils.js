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
exports.authorizeAction = exports.checkConversationParticipation = exports.checkResourceOwnership = exports.isEventParticipant = exports.isConversationParticipant = exports.isResourceOwner = void 0;
const db_1 = require("../db");
// Check if a user is the owner of a resource
const isResourceOwner = (table, resourceId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // For events table, we need to check creator_id instead of user_id
        if (table === 'events') {
            const resource = yield (0, db_1.getAsync)(`SELECT * FROM ${table} WHERE id = ? AND creator_id = ?`, [resourceId, userId]);
            return !!resource;
        }
        else {
            const resource = yield (0, db_1.getAsync)(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`, [resourceId, userId]);
            return !!resource;
        }
    }
    catch (error) {
        console.error(`Error checking resource ownership in table ${table}:`, error);
        return false;
    }
});
exports.isResourceOwner = isResourceOwner;
// Check if a user is a participant in a conversation
const isConversationParticipant = (conversationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const participant = yield (0, db_1.getAsync)(`SELECT * FROM conversation_participants WHERE conversation_id = ? AND user_id = ?`, [conversationId, userId]);
        return !!participant;
    }
    catch (error) {
        console.error('Error checking conversation participation:', error);
        return false;
    }
});
exports.isConversationParticipant = isConversationParticipant;
// Check if a user is a participant in an event
const isEventParticipant = (eventId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const participant = yield (0, db_1.getAsync)(`SELECT * FROM event_participants WHERE event_id = ? AND user_id = ?`, [eventId, userId]);
        return !!participant;
    }
    catch (error) {
        console.error('Error checking event participation:', error);
        return false;
    }
});
exports.isEventParticipant = isEventParticipant;
// Middleware to check if the user is the owner of a resource
const checkResourceOwnership = (table, paramName = 'id') => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const resourceId = req.params[paramName];
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const isOwner = yield (0, exports.isResourceOwner)(table, resourceId, userId);
            if (!isOwner) {
                res.status(403).json({ message: 'Forbidden: You do not own this resource' });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Error in resource ownership middleware:', error);
            res.status(500).json({ message: 'Server error while checking authorization' });
        }
    });
};
exports.checkResourceOwnership = checkResourceOwnership;
// Middleware to check if the user is a participant in a conversation
const checkConversationParticipation = (paramName = 'conversationId') => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const conversationId = req.params[paramName];
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const isParticipant = yield (0, exports.isConversationParticipant)(conversationId, userId);
            if (!isParticipant) {
                res.status(403).json({ message: 'Forbidden: You are not a participant in this conversation' });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Error in conversation participation middleware:', error);
            res.status(500).json({ message: 'Server error while checking authorization' });
        }
    });
};
exports.checkConversationParticipation = checkConversationParticipation;
// General authorization middleware for various scenarios
const authorizeAction = (actionType, entityType, paramName = 'id') => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const resourceId = req.params[paramName];
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            let isAuthorized = false;
            switch (entityType) {
                case 'event':
                    if (actionType === 'delete' || actionType === 'update') {
                        // Only owner can delete/update
                        isAuthorized = yield (0, exports.isResourceOwner)('events', resourceId, userId);
                    }
                    else if (actionType === 'view') {
                        // Public events can be viewed by anyone
                        isAuthorized = true;
                    }
                    break;
                case 'discussion':
                    if (actionType === 'delete' || actionType === 'update') {
                        // Only owner can delete/update
                        isAuthorized = yield (0, exports.isResourceOwner)('discussions', resourceId, userId);
                    }
                    else if (actionType === 'view') {
                        // Public discussions can be viewed by anyone
                        isAuthorized = true;
                    }
                    break;
                case 'message':
                    if (actionType === 'delete') {
                        // Only sender can delete
                        isAuthorized = yield (0, exports.isResourceOwner)('messages', resourceId, userId);
                    }
                    else if (actionType === 'view') {
                        // Only conversation participants can view
                        const message = yield (0, db_1.getAsync)('SELECT conversation_id FROM messages WHERE id = ?', [resourceId]);
                        if (message) {
                            isAuthorized = yield (0, exports.isConversationParticipant)(message.conversation_id, userId);
                        }
                    }
                    break;
                case 'comment':
                    if (actionType === 'delete') {
                        // User can delete if: 1) They are the comment author OR 2) They are the event/discussion creator
                        const commentId = resourceId;
                        // First check if comment exists and get its relationships
                        const comment = yield (0, db_1.getAsync)(`SELECT c.id, c.user_id, c.event_id, c.discussion_id,
                e.creator_id as event_creator_id,
                d.creator_id as discussion_creator_id
               FROM comments c
               LEFT JOIN events e ON c.event_id = e.id
               LEFT JOIN discussions d ON c.discussion_id = d.id
               WHERE c.id = ?`, [commentId]);
                        if (comment) {
                            // User can delete if they are comment owner
                            if (comment.user_id === userId) {
                                isAuthorized = true;
                            }
                            // Or if they are the event creator
                            else if (comment.event_id && comment.event_creator_id === userId) {
                                isAuthorized = true;
                            }
                            // Or if they are the discussion creator
                            else if (comment.discussion_id && comment.discussion_creator_id === userId) {
                                isAuthorized = true;
                            }
                        }
                    }
                    break;
                default:
                    res.status(400).json({ message: 'Invalid entity type' });
                    return;
            }
            if (!isAuthorized) {
                res.status(403).json({ message: `Forbidden: You cannot ${actionType} this ${entityType}` });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Error in authorization middleware:', error);
            res.status(500).json({ message: 'Server error while checking authorization' });
        }
    });
};
exports.authorizeAction = authorizeAction;
