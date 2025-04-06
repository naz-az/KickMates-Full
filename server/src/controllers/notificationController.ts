import { Request, Response } from 'express';
import db from '../db';
import { getAsync, allAsync, runAsync } from '../db';

// Types
export interface Notification {
  id: number;
  user_id: number;
  type: 'event_invite' | 'event_update' | 'event_reminder' | 'comment' | 'join_request' | 'join_accepted' | 'system';
  content: string;
  related_id?: number;
  is_read: boolean;
  created_at: string;
}

interface CountResult {
  count: number;
}

// Get all notifications for a user
export const getUserNotifications = (req: Request, res: Response) => {
  const userId = req.user.id;
  
  db.all(
    `SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC`,
    [userId],
    (err, notifications) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to retrieve notifications' });
      }
      
      res.json(notifications);
    }
  );
};

// Get unread notification count
export const getUnreadCount = (req: Request, res: Response) => {
  const userId = req.user.id;
  
  db.get(
    `SELECT COUNT(*) as count FROM notifications 
    WHERE user_id = ? AND is_read = 0`,
    [userId],
    (err, result: CountResult) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to count notifications' });
      }
      
      res.json({ count: result.count });
    }
  );
};

// Mark notification as read
export const markAsRead = (req: Request, res: Response) => {
  const userId = req.user.id;
  const notificationId = req.params.id;
  
  db.run(
    `UPDATE notifications 
    SET is_read = 1 
    WHERE id = ? AND user_id = ?`,
    [notificationId, userId],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to update notification' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json({ message: 'Notification marked as read' });
    }
  );
};

// Mark all notifications as read
export const markAllAsRead = (req: Request, res: Response) => {
  const userId = req.user.id;
  
  db.run(
    `UPDATE notifications 
    SET is_read = 1 
    WHERE user_id = ? AND is_read = 0`,
    [userId],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to update notifications' });
      }
      
      res.json({ message: 'All notifications marked as read', count: this.changes });
    }
  );
};

// Delete a notification
export const deleteNotification = (req: Request, res: Response) => {
  const userId = req.user.id;
  const notificationId = req.params.id;
  
  db.run(
    `DELETE FROM notifications 
    WHERE id = ? AND user_id = ?`,
    [notificationId, userId],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to delete notification' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json({ message: 'Notification deleted' });
    }
  );
};

// Create a notification
export const createNotification = async (
  userId: number, 
  type: string, 
  content: string, 
  relatedId: number | null = null,
  senderId: number | null = null,
  senderImage: string | null = null
): Promise<void> => {
  try {
    await runAsync(
      `INSERT INTO notifications (user_id, type, content, related_id, sender_id, sender_image) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, content, relatedId, senderId, senderImage]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}; 