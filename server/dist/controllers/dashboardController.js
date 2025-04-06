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
exports.getUpcomingEvents = exports.getProductivityData = exports.getUserStatistics = exports.getUserCourses = exports.getTopCourses = void 0;
const db_1 = require("../db");
/**
 * Get top recommended sports events
 */
const getTopCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Changed SQL to fetch from events table instead of dashboard_courses
        const events = yield (0, db_1.allAsync)(`SELECT e.id, e.title, e.description, e.sport_type, e.location, e.start_date as event_date, e.end_date as event_time, 
              u.username as organizer, u.profile_image as organizer_avatar, 
              (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participants_count,
              e.image_url
       FROM events e
       JOIN users u ON e.creator_id = u.id
       ORDER BY participants_count DESC 
       LIMIT 4`);
        res.status(200).json(events);
    }
    catch (error) {
        console.error('Error getting top events:', error);
        res.status(500).json({ message: 'Failed to fetch top events' });
    }
});
exports.getTopCourses = getTopCourses;
/**
 * Get user events with participants
 */
const getUserCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        // Changed to get user's events 
        const userEvents = yield (0, db_1.allAsync)(`SELECT e.id, e.title, e.sport_type, e.start_date as event_date, e.end_date as event_time, e.image_url,
              (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as total_participants
       FROM events e
       WHERE e.creator_id = ? OR e.id IN (SELECT event_id FROM event_participants WHERE user_id = ?)
       ORDER BY e.start_date
       LIMIT 4`, [userId, userId]);
        // Get participants for each event
        const eventsWithParticipants = yield Promise.all(userEvents.map((event) => __awaiter(void 0, void 0, void 0, function* () {
            const participants = yield (0, db_1.allAsync)(`SELECT u.id, u.profile_image 
           FROM event_participants ep
           JOIN users u ON ep.user_id = u.id
           WHERE ep.event_id = ?
           LIMIT 5`, [event.id]);
            return Object.assign(Object.assign({}, event), { participants: participants.map((p) => p.profile_image) });
        })));
        res.status(200).json(eventsWithParticipants);
    }
    catch (error) {
        console.error('Error getting user events:', error);
        res.status(500).json({ message: 'Failed to fetch user events' });
    }
});
exports.getUserCourses = getUserCourses;
/**
 * Get user statistics
 */
const getUserStatistics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        // Calculate statistics based on user's events and participation
        const eventsCreated = yield (0, db_1.getAsync)(`SELECT COUNT(*) as count FROM events WHERE creator_id = ?`, [userId]);
        const eventsJoined = yield (0, db_1.getAsync)(`SELECT COUNT(*) as count FROM event_participants WHERE user_id = ?`, [userId]);
        const discussionsCreated = yield (0, db_1.getAsync)(`SELECT COUNT(*) as count FROM discussions WHERE creator_id = ?`, [userId]);
        const commentsPosted = yield (0, db_1.getAsync)(`SELECT COUNT(*) as count FROM comments WHERE user_id = ?`, [userId]);
        // Format the response
        const formattedStats = {
            eventsCreated: {
                value: (eventsCreated === null || eventsCreated === void 0 ? void 0 : eventsCreated.count) || 0,
                change: '+10%' // For demo purposes
            },
            eventsJoined: {
                value: (eventsJoined === null || eventsJoined === void 0 ? void 0 : eventsJoined.count) || 0,
                change: '+15%' // For demo purposes
            },
            discussionsCreated: {
                value: (discussionsCreated === null || discussionsCreated === void 0 ? void 0 : discussionsCreated.count) || 0,
                change: '+5%' // For demo purposes
            },
            commentsPosted: {
                value: (commentsPosted === null || commentsPosted === void 0 ? void 0 : commentsPosted.count) || 0,
                change: '+20%' // For demo purposes
            }
        };
        res.status(200).json(formattedStats);
    }
    catch (error) {
        console.error('Error getting user statistics:', error);
        res.status(500).json({ message: 'Failed to fetch user statistics' });
    }
});
exports.getUserStatistics = getUserStatistics;
/**
 * Get activity data for the past week
 */
const getProductivityData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        // Generate days of the week
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        // Generate some activity data based on events and discussions
        // In a real app, this would query events and discussions by day
        const eventsCreated = Array(7).fill(0).map(() => Math.floor(Math.random() * 2));
        const eventsJoined = Array(7).fill(0).map(() => Math.floor(Math.random() * 3));
        const discussionsParticipated = Array(7).fill(0).map(() => Math.floor(Math.random() * 4));
        // Format the response
        const formattedData = {
            days,
            eventsCreated,
            eventsJoined,
            discussionsParticipated
        };
        res.status(200).json(formattedData);
    }
    catch (error) {
        console.error('Error getting activity data:', error);
        res.status(500).json({ message: 'Failed to fetch activity data' });
    }
});
exports.getProductivityData = getProductivityData;
/**
 * Get upcoming events
 */
const getUpcomingEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const events = yield (0, db_1.allAsync)(`SELECT e.id, e.title, e.sport_type as type, 
              strftime('%B %d', e.start_date) as event_date, 
              strftime('%H:%M', e.start_date) as event_time
       FROM events e
       WHERE e.start_date >= date('now')
       AND (e.creator_id = ? OR e.id IN (SELECT event_id FROM event_participants WHERE user_id = ?))
       ORDER BY e.start_date
       LIMIT 5`, [userId, userId]);
        res.status(200).json(events);
    }
    catch (error) {
        console.error('Error getting upcoming events:', error);
        res.status(500).json({ message: 'Failed to fetch upcoming events' });
    }
});
exports.getUpcomingEvents = getUpcomingEvents;
