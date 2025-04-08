import { Request, Response, NextFunction, RequestHandler } from 'express';
import { getAsync } from '../db';

// Types
export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

// Check if a user is the owner of a resource
export const isResourceOwner = async (
  table: string, 
  resourceId: string | number, 
  userId: number
): Promise<boolean> => {
  try {
    // For events and discussions tables, we need to check creator_id instead of user_id
    if (table === 'events' || table === 'discussions') {
      const resource = await getAsync(
        `SELECT * FROM ${table} WHERE id = ? AND creator_id = ?`,
        [resourceId, userId]
      );
      return !!resource;
    } else {
      const resource = await getAsync(
        `SELECT * FROM ${table} WHERE id = ? AND user_id = ?`,
        [resourceId, userId]
      );
      return !!resource;
    }
  } catch (error) {
    console.error(`Error checking resource ownership in table ${table}:`, error);
    return false;
  }
};

// Check if a user is a participant in a conversation
export const isConversationParticipant = async (
  conversationId: string | number,
  userId: number
): Promise<boolean> => {
  try {
    const participant = await getAsync(
      `SELECT * FROM conversation_participants WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, userId]
    );
    return !!participant;
  } catch (error) {
    console.error('Error checking conversation participation:', error);
    return false;
  }
};

// Check if a user is a participant in an event
export const isEventParticipant = async (
  eventId: string | number,
  userId: number
): Promise<boolean> => {
  try {
    const participant = await getAsync(
      `SELECT * FROM event_participants WHERE event_id = ? AND user_id = ?`,
      [eventId, userId]
    );
    return !!participant;
  } catch (error) {
    console.error('Error checking event participation:', error);
    return false;
  }
};

// Middleware to check if the user is the owner of a resource
export const checkResourceOwnership = (table: string, paramName: string = 'id'): RequestHandler => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resourceId = req.params[paramName];
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const isOwner = await isResourceOwner(table, resourceId, userId);
      
      if (!isOwner) {
        res.status(403).json({ message: 'Forbidden: You do not own this resource' });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Error in resource ownership middleware:', error);
      res.status(500).json({ message: 'Server error while checking authorization' });
    }
  };
};

// Middleware to check if the user is a participant in a conversation
export const checkConversationParticipation = (paramName: string = 'conversationId'): RequestHandler => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversationId = req.params[paramName];
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const isParticipant = await isConversationParticipant(conversationId, userId);
      
      if (!isParticipant) {
        res.status(403).json({ message: 'Forbidden: You are not a participant in this conversation' });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Error in conversation participation middleware:', error);
      res.status(500).json({ message: 'Server error while checking authorization' });
    }
  };
};

// General authorization middleware for various scenarios
export const authorizeAction = (
  actionType: 'delete' | 'update' | 'view',
  entityType: 'event' | 'discussion' | 'message' | 'comment',
  paramName: string = 'id'
): RequestHandler => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resourceId = req.params[paramName];
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      let isAuthorized = false;
      
      switch (entityType) {
        case 'event':
          if (actionType === 'delete' || actionType === 'update') {
            // Only owner can delete/update
            isAuthorized = await isResourceOwner('events', resourceId, userId);
          } else if (actionType === 'view') {
            // Public events can be viewed by anyone
            isAuthorized = true;
          }
          break;
          
        case 'discussion':
          if (actionType === 'delete' || actionType === 'update') {
            // Only owner can delete/update
            isAuthorized = await isResourceOwner('discussions', resourceId, userId);
          } else if (actionType === 'view') {
            // Public discussions can be viewed by anyone
            isAuthorized = true;
          }
          break;
          
        case 'message':
          if (actionType === 'delete') {
            // Only sender can delete
            const message = await getAsync('SELECT sender_id FROM messages WHERE id = ?', [resourceId]);
            isAuthorized = message && message.sender_id === userId;
          } else if (actionType === 'view') {
            // Only conversation participants can view
            const message = await getAsync('SELECT conversation_id FROM messages WHERE id = ?', [resourceId]);
            if (message) {
              isAuthorized = await isConversationParticipant(message.conversation_id, userId);
            }
          }
          break;
          
        case 'comment':
          if (actionType === 'delete' || actionType === 'update') {
            // Only owner can delete/update
            isAuthorized = await isResourceOwner('comments', resourceId, userId);
          } else if (actionType === 'view') {
            // Public comments can be viewed by anyone
            isAuthorized = true;
          }
          break;
      }
      
      if (!isAuthorized) {
        res.status(403).json({ message: 'Not authorized to perform this action' });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ message: 'Server error during authorization' });
    }
  };
}; 