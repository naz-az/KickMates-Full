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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfileImage = exports.deleteAccount = exports.changePassword = exports.getUserEventsById = exports.getUserById = exports.getAllUsers = exports.getUserBookmarks = exports.getUserEvents = exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const db_1 = require("../db");
const auth_1 = require("../utils/auth");
// Register new user
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password, full_name, bio } = req.body;
        // Validate input
        if (!username || !email || !password) {
            res.status(400).json({ message: 'Please provide username, email and password' });
            return;
        }
        // Check if user already exists
        const existingUser = yield (0, db_1.getAsync)('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser) {
            res.status(400).json({ message: 'Username or email already in use' });
            return;
        }
        // Hash password
        const hashedPassword = yield (0, auth_1.hashPassword)(password);
        // Insert user
        const result = yield (0, db_1.runAsync)(`INSERT INTO users (username, email, password, full_name, bio) 
       VALUES (?, ?, ?, ?, ?)`, [username, email, hashedPassword, full_name || null, bio || null]);
        // Generate token
        const token = (0, auth_1.generateToken)(result.lastID);
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: result.lastID,
                username,
                email,
                full_name,
                bio
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});
exports.register = register;
// Login user
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            res.status(400).json({ message: 'Please provide email/username and password' });
            return;
        }
        // Find user by email or username
        const user = yield (0, db_1.getAsync)('SELECT id, username, email, password, full_name, bio, profile_image FROM users WHERE email = ? OR username = ?', [email, email]);
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        // Check password
        const isMatch = yield (0, auth_1.comparePassword)(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        // Generate token
        const token = (0, auth_1.generateToken)(user.id);
        // Remove password from response
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        res.status(200).json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});
exports.login = login;
// Get user profile
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const user = yield (0, db_1.getAsync)(`SELECT id, username, email, full_name, bio, profile_image, created_at 
       FROM users WHERE id = ?`, [userId]);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json({ user });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
});
exports.getProfile = getProfile;
// Update user profile
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { full_name, bio, profile_image } = req.body;
        // Update user
        yield (0, db_1.runAsync)(`UPDATE users 
       SET full_name = COALESCE(?, full_name), 
           bio = COALESCE(?, bio), 
           profile_image = COALESCE(?, profile_image),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`, [full_name, bio, profile_image, userId]);
        // Get updated user
        const updatedUser = yield (0, db_1.getAsync)(`SELECT id, username, email, full_name, bio, profile_image, created_at 
       FROM users WHERE id = ?`, [userId]);
        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
});
exports.updateProfile = updateProfile;
// Get user's events
const getUserEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const events = yield (0, db_1.allAsync)(`SELECT e.*, u.username as creator_name,
       (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participants_count
       FROM events e
       JOIN users u ON e.creator_id = u.id
       WHERE e.creator_id = ? OR e.id IN (
         SELECT event_id FROM event_participants p WHERE p.user_id = ?
       )
       ORDER BY e.start_date DESC`, [userId, userId]);
        res.status(200).json({ events });
    }
    catch (error) {
        console.error('Error getting user events:', error);
        res.status(500).json({ message: 'Failed to get user events' });
    }
});
exports.getUserEvents = getUserEvents;
// Get user's bookmarked events
const getUserBookmarks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const bookmarkedEvents = yield (0, db_1.allAsync)(`SELECT e.*, u.username as creator_name
       FROM events e
       JOIN bookmarks b ON e.id = b.event_id
       JOIN users u ON e.creator_id = u.id
       WHERE b.user_id = ?
       ORDER BY e.start_date ASC`, [userId]);
        res.status(200).json({ bookmarkedEvents });
    }
    catch (error) {
        console.error('Get user bookmarks error:', error);
        res.status(500).json({ message: 'Server error fetching bookmarks' });
    }
});
exports.getUserBookmarks = getUserBookmarks;
// Get all users
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield (0, db_1.allAsync)(`SELECT id, username, full_name, bio, profile_image, created_at 
       FROM users 
       ORDER BY created_at DESC`);
        res.status(200).json({ users });
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
});
exports.getAllUsers = getAllUsers;
// Get user by ID
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const user = yield (0, db_1.getAsync)(`SELECT id, username, full_name, bio, profile_image, created_at 
       FROM users WHERE id = ?`, [userId]);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json({ user });
    }
    catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ message: 'Server error fetching user' });
    }
});
exports.getUserById = getUserById;
// Get a user's events by user ID
const getUserEventsById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const ownEvents = yield (0, db_1.allAsync)(`SELECT e.*, 
       (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as current_players
       FROM events e
       WHERE e.creator_id = ?
       ORDER BY e.start_date DESC`, [id]);
        const participatingEvents = yield (0, db_1.allAsync)(`SELECT e.*, 
       (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as current_players
       FROM events e
       JOIN event_participants p ON e.id = p.event_id
       WHERE p.user_id = ? AND e.creator_id != ?
       ORDER BY e.start_date DESC`, [id, id]);
        res.status(200).json({
            created: ownEvents,
            participating: participatingEvents
        });
    }
    catch (error) {
        console.error('Error getting user events by ID:', error);
        res.status(500).json({ message: 'Failed to get user events' });
    }
});
exports.getUserEventsById = getUserEventsById;
// Change Password
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        // Validate input
        if (!currentPassword || !newPassword) {
            res.status(400).json({ message: 'Current password and new password are required' });
            return;
        }
        // Get the current user's password
        const user = yield (0, db_1.getAsync)('SELECT password FROM users WHERE id = ?', [userId]);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Verify current password
        const isMatch = yield (0, auth_1.comparePassword)(currentPassword, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Current password is incorrect' });
            return;
        }
        // Hash the new password
        const hashedPassword = yield (0, auth_1.hashPassword)(newPassword);
        // Update the password
        yield (0, db_1.runAsync)('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, userId]);
        res.status(200).json({ message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error changing password' });
    }
});
exports.changePassword = changePassword;
// Delete Account
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { password } = req.body;
        // Validate input
        if (!password) {
            res.status(400).json({ message: 'Password is required to delete your account' });
            return;
        }
        // Get the current user with password
        const user = yield (0, db_1.getAsync)('SELECT password FROM users WHERE id = ?', [userId]);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Verify password
        const isMatch = yield (0, auth_1.comparePassword)(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Incorrect password' });
            return;
        }
        // Begin transaction to delete all related user data
        yield (0, db_1.runAsync)('BEGIN TRANSACTION');
        try {
            // Delete user's notifications
            yield (0, db_1.runAsync)('DELETE FROM notifications WHERE user_id = ?', [userId]);
            // Delete user's bookmarks
            yield (0, db_1.runAsync)('DELETE FROM bookmarks WHERE user_id = ?', [userId]);
            // Delete user's comment votes
            yield (0, db_1.runAsync)('DELETE FROM comment_votes WHERE user_id = ?', [userId]);
            // Delete user's comments
            yield (0, db_1.runAsync)('DELETE FROM comments WHERE user_id = ?', [userId]);
            // Handle user's events
            // 1. Get all events created by user
            const userEvents = yield (0, db_1.allAsync)('SELECT id FROM events WHERE creator_id = ?', [userId]);
            // 2. For each event, delete related data
            for (const event of userEvents) {
                const eventId = event.id;
                // Delete participants
                yield (0, db_1.runAsync)('DELETE FROM event_participants WHERE event_id = ?', [eventId]);
                // Delete bookmarks for this event
                yield (0, db_1.runAsync)('DELETE FROM bookmarks WHERE event_id = ?', [eventId]);
                // Delete comment votes for comments on this event
                yield (0, db_1.runAsync)('DELETE FROM comment_votes WHERE comment_id IN (SELECT id FROM comments WHERE event_id = ?)', [eventId]);
                // Delete comments
                yield (0, db_1.runAsync)('DELETE FROM comments WHERE event_id = ?', [eventId]);
            }
            // 3. Delete all events created by user
            yield (0, db_1.runAsync)('DELETE FROM events WHERE creator_id = ?', [userId]);
            // Remove user from events they participate in
            yield (0, db_1.runAsync)('DELETE FROM event_participants WHERE user_id = ?', [userId]);
            // Finally, delete the user
            yield (0, db_1.runAsync)('DELETE FROM users WHERE id = ?', [userId]);
            // Commit the transaction
            yield (0, db_1.runAsync)('COMMIT');
            // Clear auth token cookie if using cookie-based auth
            // res.clearCookie('token');
            res.status(200).json({ message: 'Account deleted successfully' });
        }
        catch (error) {
            // If any error occurs, rollback the transaction
            yield (0, db_1.runAsync)('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ message: 'Server error deleting account' });
    }
});
exports.deleteAccount = deleteAccount;
// Upload profile image
const uploadProfileImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        // req.file is provided by multer middleware
        if (!req.file) {
            res.status(400).json({ message: 'No file was uploaded' });
            return;
        }
        // Save the file path or URL to the database
        const fileUrl = `/uploads/${req.file.filename}`;
        // Update user's profile_image field
        yield (0, db_1.runAsync)(`UPDATE users 
       SET profile_image = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`, [fileUrl, userId]);
        // Get updated user
        const updatedUser = yield (0, db_1.getAsync)(`SELECT id, username, email, full_name, bio, profile_image, created_at 
       FROM users WHERE id = ?`, [userId]);
        res.status(200).json({
            message: 'Profile image uploaded successfully',
            user: updatedUser
        });
    }
    catch (error) {
        console.error('Upload profile image error:', error);
        res.status(500).json({ message: 'Server error uploading profile image' });
    }
});
exports.uploadProfileImage = uploadProfileImage;
