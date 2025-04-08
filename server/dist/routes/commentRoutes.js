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
const express_1 = require("express");
const db_1 = require("../db");
const validator_1 = require("../middlewares/validator");
const router = (0, express_1.Router)();
// Get comment entity info
router.get('/:id/entity', validator_1.validateIdParam, ((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Get comment info
        const comment = yield (0, db_1.getAsync)('SELECT id, event_id, discussion_id FROM comments WHERE id = ?', [id]);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        let entityType;
        let entityId;
        if (comment.event_id !== null) {
            entityType = 'event';
            entityId = comment.event_id;
        }
        else if (comment.discussion_id !== null) {
            entityType = 'discussion';
            entityId = comment.discussion_id;
        }
        else {
            // This should not happen based on DB schema constraints
            return res.status(500).json({
                message: 'Comment has no associated entity',
                detail: 'The comment is not associated with either an event or discussion'
            });
        }
        res.status(200).json({
            entityType,
            entityId,
            commentId: comment.id
        });
    }
    catch (error) {
        console.error('Error verifying comment entity:', error);
        res.status(500).json({ message: 'Server error verifying comment entity' });
    }
})));
exports.default = router;
