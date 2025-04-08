import { Router, Request, Response, RequestHandler } from 'express';
import { authenticate } from '../middlewares/auth';
import { getAsync } from '../db';
import { validateIdParam } from '../middlewares/validator';

const router = Router();

// Get comment entity info
router.get('/:id/entity', validateIdParam, (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get comment info
    const comment = await getAsync(
      'SELECT id, event_id, discussion_id FROM comments WHERE id = ?',
      [id]
    );
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    let entityType: 'event' | 'discussion';
    let entityId: number | null;
    
    if (comment.event_id !== null) {
      entityType = 'event';
      entityId = comment.event_id;
    } else if (comment.discussion_id !== null) {
      entityType = 'discussion';
      entityId = comment.discussion_id;
    } else {
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
  } catch (error) {
    console.error('Error verifying comment entity:', error);
    res.status(500).json({ message: 'Server error verifying comment entity' });
  }
}) as RequestHandler);

export default router; 