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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getUserNotifications = void 0;
const db_1 = __importDefault(require("../db"));
const db_2 = require("../db");
// Get all notifications for a user
const getUserNotifications = (req, res) => {
    const userId = req.user.id;
    db_1.default.all(`SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC`, [userId], (err, notifications) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to retrieve notifications' });
        }
        res.json(notifications);
    });
};
exports.getUserNotifications = getUserNotifications;
// Get unread notification count
const getUnreadCount = (req, res) => {
    const userId = req.user.id;
    db_1.default.get(`SELECT COUNT(*) as count FROM notifications 
    WHERE user_id = ? AND is_read = 0`, [userId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to count notifications' });
        }
        res.json({ count: result.count });
    });
};
exports.getUnreadCount = getUnreadCount;
// Mark notification as read
const markAsRead = (req, res) => {
    const userId = req.user.id;
    const notificationId = req.params.id;
    db_1.default.run(`UPDATE notifications 
    SET is_read = 1 
    WHERE id = ? AND user_id = ?`, [notificationId, userId], function (err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to update notification' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.json({ message: 'Notification marked as read' });
    });
};
exports.markAsRead = markAsRead;
// Mark all notifications as read
const markAllAsRead = (req, res) => {
    const userId = req.user.id;
    db_1.default.run(`UPDATE notifications 
    SET is_read = 1 
    WHERE user_id = ? AND is_read = 0`, [userId], function (err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to update notifications' });
        }
        res.json({ message: 'All notifications marked as read', count: this.changes });
    });
};
exports.markAllAsRead = markAllAsRead;
// Delete a notification
const deleteNotification = (req, res) => {
    const userId = req.user.id;
    const notificationId = req.params.id;
    db_1.default.run(`DELETE FROM notifications 
    WHERE id = ? AND user_id = ?`, [notificationId, userId], function (err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete notification' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.json({ message: 'Notification deleted' });
    });
};
exports.deleteNotification = deleteNotification;
// Create a notification
const createNotification = (userId_1, type_1, content_1, ...args_1) => __awaiter(void 0, [userId_1, type_1, content_1, ...args_1], void 0, function* (userId, type, content, relatedId = null, senderId = null, senderImage = null) {
    try {
        yield (0, db_2.runAsync)(`INSERT INTO notifications (user_id, type, content, related_id, sender_id, sender_image) 
       VALUES (?, ?, ?, ?, ?, ?)`, [userId, type, content, relatedId, senderId, senderImage]);
    }
    catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
});
exports.createNotification = createNotification;
