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
exports.updateCommentAssociation = void 0;
const db_1 = require("../db");
// Update a comment's association (event_id or discussion_id)
const updateCommentAssociation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { event_id, discussion_id } = req.body;
        const userId = req.user.id;
        console.log('Update comment association request:', {
            commentId: id,
            userId,
            event_id,
            discussion_id
        });
        // Validate request - must have either event_id or discussion_id, but not both
        if ((!event_id && !discussion_id) || (event_id && discussion_id)) {
            res.status(400).json({
                message: 'Invalid request. Provide either event_id or discussion_id, not both.'
            });
            return;
        }
        // Check if comment exists
        const comment = yield (0, db_1.getAsync)('SELECT id, event_id, discussion_id, user_id FROM comments WHERE id = ?', [id]);
        if (!comment) {
            res.status(404).json({ message: 'Comment not found' });
            return;
        }
        // Check if user is authorized (comment owner or admin)
        if (comment.user_id !== userId) {
            // For now, only allow the comment owner to modify the association
            // Later we could add admin checks here
            res.status(403).json({ message: 'Not authorized to modify this comment' });
            return;
        }
        // Check if the target event/discussion exists
        if (event_id) {
            const event = yield (0, db_1.getAsync)('SELECT id FROM events WHERE id = ?', [event_id]);
            if (!event) {
                res.status(404).json({ message: 'Event not found' });
                return;
            }
        }
        else if (discussion_id) {
            const discussion = yield (0, db_1.getAsync)('SELECT id FROM discussions WHERE id = ?', [discussion_id]);
            if (!discussion) {
                res.status(404).json({ message: 'Discussion not found' });
                return;
            }
        }
        // Update the comment's association
        yield (0, db_1.runAsync)('UPDATE comments SET event_id = ?, discussion_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [event_id || null, discussion_id || null, id]);
        // Get the updated comment
        const updatedComment = yield (0, db_1.getAsync)('SELECT id, event_id, discussion_id, content, created_at, updated_at, user_id FROM comments WHERE id = ?', [id]);
        res.status(200).json({
            message: 'Comment association updated successfully',
            comment: updatedComment
        });
    }
    catch (error) {
        console.error('Update comment association error:', error);
        res.status(500).json({ message: 'Server error updating comment association' });
    }
});
exports.updateCommentAssociation = updateCommentAssociation;
