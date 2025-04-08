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
exports.uploadEventImage = exports.voteComment = exports.deleteComment = exports.addComment = exports.bookmarkEvent = exports.leaveEvent = exports.joinEvent = exports.deleteEvent = exports.updateEvent = exports.getEventById = exports.getEvents = exports.createEvent = void 0;
const db_1 = require("../db");
const notificationController_1 = require("./notificationController");
// Create a new event
const createEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, sport_type, location, start_date, end_date, max_players, image_url } = req.body;
        const creator_id = req.user.id;
        // Validate input
        if (!title || !sport_type || !location || !start_date || !end_date || !max_players) {
            res.status(400).json({
                message: 'Please provide title, sport type, location, start date, end date, and max players'
            });
            return;
        }
        // Insert event
        const result = yield (0, db_1.runAsync)(`INSERT INTO events (
        creator_id, title, description, sport_type, location, 
        start_date, end_date, max_players, current_players, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            creator_id, title, description, sport_type, location,
            start_date, end_date, max_players, 1, image_url
        ]);
        // Add creator as a participant
        yield (0, db_1.runAsync)(`INSERT INTO event_participants (event_id, user_id, status) VALUES (?, ?, ?)`, [result.lastID, creator_id, 'confirmed']);
        // Get created event
        const event = yield (0, db_1.getAsync)(`SELECT e.*, u.username as creator_name
       FROM events e
       JOIN users u ON e.creator_id = u.id
       WHERE e.id = ?`, [result.lastID]);
        res.status(201).json({
            message: 'Event created successfully',
            event
        });
    }
    catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ message: 'Server error creating event' });
    }
});
exports.createEvent = createEvent;
// Get all events with filters
const getEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sport_type, location, date, search } = req.query;
        let query = `
      SELECT e.*, u.username as creator_name,
      (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id AND status = 'confirmed') as confirmed_players,
      (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id AND status = 'waiting') as waiting_players
      FROM events e
      JOIN users u ON e.creator_id = u.id
      WHERE 1=1
    `;
        const params = [];
        // Apply filters
        if (sport_type) {
            query += ' AND e.sport_type = ?';
            params.push(sport_type);
        }
        if (location) {
            query += ' AND e.location LIKE ?';
            params.push(`%${location}%`);
        }
        if (date) {
            query += ' AND DATE(e.start_date) = DATE(?)';
            params.push(date);
        }
        if (search) {
            query += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.sport_type LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        query += ' ORDER BY e.start_date ASC';
        const events = yield (0, db_1.allAsync)(query, params);
        // Update current_players to match confirmed_players for consistency
        const processedEvents = events.map(event => (Object.assign(Object.assign({}, event), { current_players: event.confirmed_players })));
        res.status(200).json({ events: processedEvents });
    }
    catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ message: 'Server error fetching events' });
    }
});
exports.getEvents = getEvents;
// Get an event by ID with participants and comments
const getEventById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Get the event
        const event = yield (0, db_1.getAsync)(`SELECT e.*, u.username as creator_name, u.profile_image as creator_profile_image
       FROM events e
       JOIN users u ON e.creator_id = u.id
       WHERE e.id = ?`, [id]);
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        // Get participants
        const participants = yield (0, db_1.allAsync)(`SELECT p.id, p.user_id, p.status, p.joined_at, u.username, u.profile_image
       FROM event_participants p
       JOIN users u ON p.user_id = u.id
       WHERE p.event_id = ?
       ORDER BY p.joined_at`, [id]);
        // Get all comments with user details and votes
        const comments = yield (0, db_1.allAsync)(`SELECT c.id, c.content, c.created_at, c.parent_comment_id, c.thumbs_up, c.thumbs_down, 
       u.id as user_id, u.username, u.profile_image,
       (SELECT vote_type FROM comment_votes WHERE comment_id = c.id AND user_id = ?) as user_vote
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.event_id = ?
       ORDER BY c.created_at DESC`, [userId || null, id]);
        // Check if user has bookmarked this event
        let isBookmarked = false;
        if (userId) {
            const bookmark = yield (0, db_1.getAsync)('SELECT id FROM bookmarks WHERE event_id = ? AND user_id = ?', [id, userId]);
            isBookmarked = !!bookmark;
        }
        // Check if user is a participant
        let participationStatus = null;
        if (userId) {
            const participant = yield (0, db_1.getAsync)('SELECT status FROM event_participants WHERE event_id = ? AND user_id = ?', [id, userId]);
            if (participant) {
                participationStatus = participant.status;
            }
        }
        // Update current_players count to match the number of confirmed participants
        const confirmedCount = participants.filter(p => p.status === 'confirmed').length;
        event.current_players = confirmedCount;
        // Update the current_players in the database to ensure consistency
        yield (0, db_1.runAsync)('UPDATE events SET current_players = ? WHERE id = ?', [confirmedCount, id]);
        res.status(200).json({
            event,
            participants,
            comments,
            isBookmarked,
            participationStatus
        });
    }
    catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ message: 'Server error getting event details' });
    }
});
exports.getEventById = getEventById;
// Update an event
const updateEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Check if user is the creator
        const event = yield (0, db_1.getAsync)('SELECT creator_id FROM events WHERE id = ?', [id]);
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        if (event.creator_id !== userId) {
            res.status(403).json({ message: 'Not authorized to update this event' });
            return;
        }
        const { title, description, sport_type, location, start_date, end_date, max_players, image_url } = req.body;
        // Update event
        yield (0, db_1.runAsync)(`UPDATE events SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        sport_type = COALESCE(?, sport_type),
        location = COALESCE(?, location),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        max_players = COALESCE(?, max_players),
        image_url = COALESCE(?, image_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`, [
            title, description, sport_type, location,
            start_date, end_date, max_players, image_url, id
        ]);
        // Get updated event
        const updatedEvent = yield (0, db_1.getAsync)(`SELECT e.*, u.username as creator_name
       FROM events e
       JOIN users u ON e.creator_id = u.id
       WHERE e.id = ?`, [id]);
        res.status(200).json({
            message: 'Event updated successfully',
            event: updatedEvent
        });
    }
    catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ message: 'Server error updating event' });
    }
});
exports.updateEvent = updateEvent;
// Delete an event
const deleteEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Check if user is the creator
        const event = yield (0, db_1.getAsync)('SELECT creator_id FROM events WHERE id = ?', [id]);
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        if (event.creator_id !== userId) {
            res.status(403).json({ message: 'Not authorized to delete this event' });
            return;
        }
        // Start transaction properly using runAsync
        yield (0, db_1.runAsync)('BEGIN TRANSACTION');
        try {
            // Delete notifications related to this event
            yield (0, db_1.runAsync)('DELETE FROM notifications WHERE related_id = ?', [id]);
            // Delete comment votes first
            yield (0, db_1.runAsync)('DELETE FROM comment_votes WHERE comment_id IN (SELECT id FROM comments WHERE event_id = ?)', [id]);
            // Then delete comments
            yield (0, db_1.runAsync)('DELETE FROM comments WHERE event_id = ?', [id]);
            // Delete participants
            yield (0, db_1.runAsync)('DELETE FROM event_participants WHERE event_id = ?', [id]);
            // Delete bookmarks
            yield (0, db_1.runAsync)('DELETE FROM bookmarks WHERE event_id = ?', [id]);
            // Finally delete the event
            yield (0, db_1.runAsync)('DELETE FROM events WHERE id = ?', [id]);
            // Commit transaction
            yield (0, db_1.runAsync)('COMMIT');
            res.status(200).json({ message: 'Event deleted successfully' });
        }
        catch (error) {
            // Rollback transaction on error
            yield (0, db_1.runAsync)('ROLLBACK');
            console.error('Transaction error:', error);
            throw error;
        }
    }
    catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ message: 'Server error deleting event' });
    }
});
exports.deleteEvent = deleteEvent;
// Join an event
const joinEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Check if event exists
        const event = yield (0, db_1.getAsync)('SELECT * FROM events WHERE id = ?', [id]);
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        // Check if user is already a participant
        const existingParticipant = yield (0, db_1.getAsync)('SELECT * FROM event_participants WHERE event_id = ? AND user_id = ?', [id, userId]);
        if (existingParticipant) {
            res.status(400).json({ message: 'You are already participating in this event' });
            return;
        }
        // Get user details for notification
        const user = yield (0, db_1.getAsync)('SELECT username, profile_image FROM users WHERE id = ?', [userId]);
        // Check if event is full
        const confirmedParticipants = yield (0, db_1.getAsync)('SELECT COUNT(*) as count FROM event_participants WHERE event_id = ? AND status = "confirmed"', [id]);
        if (confirmedParticipants.count >= event.max_players) {
            // Add user to waiting list
            yield (0, db_1.runAsync)('INSERT INTO event_participants (event_id, user_id, status) VALUES (?, ?, "waiting")', [id, userId]);
            // Notify event creator about new waiting list join
            const joinRequest = `${user.username} joined the waiting list for your event "${event.title}"`;
            yield (0, notificationController_1.createNotification)(event.creator_id, 'join_request', joinRequest, parseInt(id), userId, user.profile_image);
            res.status(200).json({ message: 'Added to the waiting list, event is currently full', status: 'waiting' });
        }
        else {
            // Add user as a confirmed participant
            yield (0, db_1.runAsync)('INSERT INTO event_participants (event_id, user_id, status) VALUES (?, ?, "confirmed")', [id, userId]);
            // Update current_players in events table
            yield (0, db_1.runAsync)('UPDATE events SET current_players = current_players + 1 WHERE id = ?', [id]);
            // Notify event creator
            const joinMessage = `${user.username} joined your event "${event.title}"`;
            yield (0, notificationController_1.createNotification)(event.creator_id, 'join_accepted', joinMessage, parseInt(id), userId, user.profile_image);
            res.status(200).json({ message: 'Successfully joined the event', status: 'confirmed' });
        }
    }
    catch (error) {
        console.error('Join event error:', error);
        res.status(500).json({ message: 'Server error joining event' });
    }
});
exports.joinEvent = joinEvent;
// Leave an event
const leaveEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Check if event exists
        const event = yield (0, db_1.getAsync)('SELECT * FROM events WHERE id = ?', [id]);
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        // Check if user is a participant
        const participant = yield (0, db_1.getAsync)('SELECT * FROM event_participants WHERE event_id = ? AND user_id = ?', [id, userId]);
        if (!participant) {
            res.status(400).json({ message: 'You are not participating in this event' });
            return;
        }
        // Get user details for notification
        const user = yield (0, db_1.getAsync)('SELECT username, profile_image FROM users WHERE id = ?', [userId]);
        // Remove user from participants
        yield (0, db_1.runAsync)('DELETE FROM event_participants WHERE event_id = ? AND user_id = ?', [id, userId]);
        // If user was a confirmed participant, update current_players and check waiting list
        if (participant.status === 'confirmed') {
            // Decrement current_players
            yield (0, db_1.runAsync)('UPDATE events SET current_players = current_players - 1 WHERE id = ?', [id]);
            // Notify event creator
            const leaveMessage = `${user.username} left your event "${event.title}"`;
            yield (0, notificationController_1.createNotification)(event.creator_id, 'event_update', leaveMessage, parseInt(id), userId, user.profile_image);
            // Check if there's anyone on the waiting list
            const waitingParticipant = yield (0, db_1.getAsync)('SELECT p.*, u.username, u.profile_image FROM event_participants p JOIN users u ON p.user_id = u.id WHERE p.event_id = ? AND p.status = "waiting" ORDER BY p.joined_at ASC LIMIT 1', [id]);
            if (waitingParticipant) {
                // Move first waiting participant to confirmed
                yield (0, db_1.runAsync)('UPDATE event_participants SET status = "confirmed" WHERE id = ?', [waitingParticipant.id]);
                // Increment current_players
                yield (0, db_1.runAsync)('UPDATE events SET current_players = current_players + 1 WHERE id = ?', [id]);
                // Notify the promoted user
                const promotionMessage = `You've been moved from the waiting list to confirmed participants for "${event.title}"`;
                yield (0, notificationController_1.createNotification)(waitingParticipant.user_id, 'join_accepted', promotionMessage, parseInt(id), event.creator_id, null);
            }
        }
        res.status(200).json({ message: 'Successfully left the event' });
    }
    catch (error) {
        console.error('Leave event error:', error);
        res.status(500).json({ message: 'Server error leaving event' });
    }
});
exports.leaveEvent = leaveEvent;
// Bookmark an event
const bookmarkEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Check if event exists
        const event = yield (0, db_1.getAsync)('SELECT id FROM events WHERE id = ?', [id]);
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        // Check if already bookmarked
        const existingBookmark = yield (0, db_1.getAsync)('SELECT id FROM bookmarks WHERE event_id = ? AND user_id = ?', [id, userId]);
        if (existingBookmark) {
            // Remove bookmark
            yield (0, db_1.runAsync)('DELETE FROM bookmarks WHERE event_id = ? AND user_id = ?', [id, userId]);
            res.status(200).json({
                message: 'Event removed from bookmarks',
                bookmarked: false,
                is_bookmarked: false
            });
            return;
        }
        // Add bookmark
        yield (0, db_1.runAsync)('INSERT INTO bookmarks (event_id, user_id) VALUES (?, ?)', [id, userId]);
        res.status(200).json({
            message: 'Event bookmarked',
            bookmarked: true,
            is_bookmarked: true
        });
    }
    catch (error) {
        console.error('Bookmark event error:', error);
        res.status(500).json({ message: 'Server error bookmarking event' });
    }
});
exports.bookmarkEvent = bookmarkEvent;
// Add a comment to an event
const addComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { content, parent_comment_id } = req.body;
        if (!content || !content.trim()) {
            res.status(400).json({ message: 'Comment content is required' });
            return;
        }
        // Check if event exists
        const event = yield (0, db_1.getAsync)('SELECT id, title, creator_id FROM events WHERE id = ?', [id]);
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        // Get user details for notification
        const user = yield (0, db_1.getAsync)('SELECT username, profile_image FROM users WHERE id = ?', [userId]);
        // If parentCommentId is provided, check if it exists and belongs to this event
        if (parent_comment_id) {
            const parentComment = yield (0, db_1.getAsync)('SELECT id, user_id FROM comments WHERE id = ? AND event_id = ?', [parent_comment_id, id]);
            if (!parentComment) {
                res.status(404).json({ message: 'Parent comment not found' });
                return;
            }
            // Send notification to parent comment author if it's not the current user
            if (parentComment.user_id !== userId) {
                const replyNotification = `${user.username} replied to your comment on event "${event.title}"`;
                yield (0, notificationController_1.createNotification)(parentComment.user_id, 'comment', replyNotification, parseInt(id), userId, user.profile_image);
            }
        }
        // Add comment
        const result = yield (0, db_1.runAsync)('INSERT INTO comments (event_id, user_id, content, parent_comment_id) VALUES (?, ?, ?, ?)', [id, userId, content, parent_comment_id || null]);
        // Send notification to event creator (if not the commenter)
        if (event.creator_id !== userId) {
            const commentNotification = `${user.username} commented on your event "${event.title}"`;
            yield (0, notificationController_1.createNotification)(event.creator_id, 'comment', commentNotification, parseInt(id), userId, user.profile_image);
        }
        // Get comment with user details
        const comment = yield (0, db_1.getAsync)(`SELECT c.id, c.content, c.created_at, c.parent_comment_id, c.thumbs_up, c.thumbs_down,
        u.id as user_id, u.username, u.profile_image,
        NULL as user_vote
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`, [result.lastID]);
        res.status(201).json({
            message: 'Comment added',
            comment
        });
    }
    catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Server error adding comment' });
    }
});
exports.addComment = addComment;
// Delete a comment
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, commentId } = req.params;
        const userId = req.user.id;
        // Check if comment exists and belongs to user or is event creator
        const comment = yield (0, db_1.getAsync)(`SELECT c.id, c.user_id, e.creator_id
       FROM comments c
       JOIN events e ON c.event_id = e.id
       WHERE c.id = ? AND c.event_id = ?`, [commentId, id]);
        if (!comment) {
            res.status(404).json({ message: 'Comment not found' });
            return;
        }
        // Check if user is comment owner or event creator
        if (comment.user_id !== userId && comment.creator_id !== userId) {
            res.status(403).json({ message: 'Not authorized to delete this comment' });
            return;
        }
        // Start a transaction
        yield (0, db_1.runAsync)('BEGIN TRANSACTION');
        try {
            // First, recursively delete all child comments (replies to this comment)
            // This helper function will find all child comments and delete them
            const deleteReplies = (parentCommentId) => __awaiter(void 0, void 0, void 0, function* () {
                // Find all replies to this comment
                const replies = yield (0, db_1.allAsync)('SELECT id FROM comments WHERE parent_comment_id = ?', [parentCommentId]);
                // For each reply, recursively delete its replies first
                for (const reply of replies) {
                    yield deleteReplies(reply.id.toString());
                }
                // Delete all votes for these comments
                yield (0, db_1.runAsync)('DELETE FROM comment_votes WHERE comment_id IN (SELECT id FROM comments WHERE parent_comment_id = ?)', [parentCommentId]);
                // Then delete all replies to this comment
                yield (0, db_1.runAsync)('DELETE FROM comments WHERE parent_comment_id = ?', [parentCommentId]);
            });
            // First delete all nested replies
            yield deleteReplies(commentId);
            // Delete votes for this comment
            yield (0, db_1.runAsync)('DELETE FROM comment_votes WHERE comment_id = ?', [commentId]);
            // Finally delete the comment itself
            yield (0, db_1.runAsync)('DELETE FROM comments WHERE id = ?', [commentId]);
            // Commit the transaction
            yield (0, db_1.runAsync)('COMMIT');
            res.status(200).json({ message: 'Comment deleted' });
        }
        catch (error) {
            // Rollback on error
            yield (0, db_1.runAsync)('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: 'Server error deleting comment' });
    }
});
exports.deleteComment = deleteComment;
// Vote on a comment (thumbs up/down)
const voteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, commentId } = req.params;
        const userId = req.user.id;
        const { voteType } = req.body;
        if (!voteType || (voteType !== 'up' && voteType !== 'down')) {
            res.status(400).json({ message: 'Vote type must be "up" or "down"' });
            return;
        }
        // Convert IDs to numbers to ensure proper comparison in the database
        const eventId = parseInt(id, 10);
        const cmtId = parseInt(commentId, 10);
        // First, check if comment exists at all, regardless of which entity it belongs to
        const comment = yield (0, db_1.getAsync)('SELECT id, thumbs_up, thumbs_down, event_id, discussion_id FROM comments WHERE id = ?', [cmtId]);
        if (!comment) {
            res.status(404).json({ message: 'Comment not found' });
            return;
        }
        // Check if comment belongs to a discussion instead of an event
        if (comment.discussion_id !== null && comment.event_id === null) {
            res.status(404).json({
                message: 'Comment belongs to a discussion, not an event',
                correctType: 'discussion',
                correctId: comment.discussion_id,
                detail: 'This comment is associated with a discussion, not an event.'
            });
            return;
        }
        // Check if comment belongs to the specified event
        if (comment.event_id !== eventId) {
            res.status(404).json({
                message: 'Comment not found for this event',
                correctType: 'event',
                correctId: comment.event_id,
                detail: 'The comment exists but belongs to a different event.'
            });
            return;
        }
        // Check if user has already voted on this comment
        const existingVote = yield (0, db_1.getAsync)('SELECT vote_type FROM comment_votes WHERE comment_id = ? AND user_id = ?', [cmtId, userId]);
        // Start a transaction for the update
        yield (0, db_1.runAsync)('BEGIN TRANSACTION');
        try {
            let newThumbsUp = comment.thumbs_up;
            let newThumbsDown = comment.thumbs_down;
            if (existingVote) {
                // User is changing their vote
                if (existingVote.vote_type !== voteType) {
                    // Update the vote type
                    yield (0, db_1.runAsync)('UPDATE comment_votes SET vote_type = ? WHERE comment_id = ? AND user_id = ?', [voteType, cmtId, userId]);
                    // Adjust the counters
                    if (voteType === 'up') {
                        newThumbsUp += 1;
                        newThumbsDown -= 1;
                    }
                    else {
                        newThumbsUp -= 1;
                        newThumbsDown += 1;
                    }
                }
                else {
                    // User is removing their vote
                    yield (0, db_1.runAsync)('DELETE FROM comment_votes WHERE comment_id = ? AND user_id = ?', [cmtId, userId]);
                    // Adjust the counters
                    if (voteType === 'up') {
                        newThumbsUp -= 1;
                    }
                    else {
                        newThumbsDown -= 1;
                    }
                }
            }
            else {
                // User is adding a new vote
                yield (0, db_1.runAsync)('INSERT INTO comment_votes (comment_id, user_id, vote_type) VALUES (?, ?, ?)', [cmtId, userId, voteType]);
                // Adjust the counters
                if (voteType === 'up') {
                    newThumbsUp += 1;
                }
                else {
                    newThumbsDown += 1;
                }
            }
            // Update comment counter
            yield (0, db_1.runAsync)('UPDATE comments SET thumbs_up = ?, thumbs_down = ? WHERE id = ?', [newThumbsUp, newThumbsDown, cmtId]);
            yield (0, db_1.runAsync)('COMMIT');
            const responseData = {
                message: 'Vote recorded',
                comment: {
                    id: comment.id,
                    thumbs_up: newThumbsUp,
                    thumbs_down: newThumbsDown,
                    user_vote: existingVote && existingVote.vote_type === voteType ? null : voteType
                }
            };
            res.status(200).json(responseData);
        }
        catch (error) {
            yield (0, db_1.runAsync)('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error voting on comment' });
    }
});
exports.voteComment = voteComment;
// Upload event image
const uploadEventImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Check if user is the creator
        const event = yield (0, db_1.getAsync)('SELECT creator_id FROM events WHERE id = ?', [id]);
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        if (event.creator_id !== userId) {
            res.status(403).json({ message: 'Not authorized to update this event' });
            return;
        }
        // req.file is provided by multer middleware
        if (!req.file) {
            res.status(400).json({ message: 'No file was uploaded' });
            return;
        }
        // Save the file path or URL to the database
        const fileUrl = `/uploads/${req.file.filename}`;
        // Update event's image_url field
        yield (0, db_1.runAsync)(`UPDATE events 
       SET image_url = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`, [fileUrl, id]);
        // Get updated event
        const updatedEvent = yield (0, db_1.getAsync)(`SELECT e.*, u.username as creator_name
       FROM events e
       JOIN users u ON e.creator_id = u.id
       WHERE e.id = ?`, [id]);
        res.status(200).json({
            message: 'Event image uploaded successfully',
            event: updatedEvent
        });
    }
    catch (error) {
        console.error('Upload event image error:', error);
        res.status(500).json({ message: 'Server error uploading event image' });
    }
});
exports.uploadEventImage = uploadEventImage;
