"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
// Apply auth middleware to all notification routes
router.use(auth_1.authenticate);
// Get all notifications for the current user
router.get('/', notificationController_1.getUserNotifications);
// Get unread notification count
router.get('/unread-count', notificationController_1.getUnreadCount);
// Mark a notification as read
router.put('/:id/read', notificationController_1.markAsRead);
// Mark all notifications as read
router.put('/read-all', notificationController_1.markAllAsRead);
// Delete a notification
router.delete('/:id', notificationController_1.deleteNotification);
exports.default = router;
