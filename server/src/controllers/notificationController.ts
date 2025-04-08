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
  sender_id?: number;
  sender_image?: string;
  is_read: boolean;
  created_at: string;
}

interface CountResult {
  count: number;
}

// Get all notifications for a user
export const getUserNotifications = (req: Request, res: Response) => {
  const userId = req.user.id;
  
  console.log(`Fetching notifications for user ID: ${userId}`);
  
  db.all(
    `SELECT n.*, 
            u.profile_image as current_sender_image,
            u.username as sender_username
     FROM notifications n
     LEFT JOIN users u ON n.sender_id = u.id
     WHERE n.user_id = ? 
     ORDER BY n.created_at DESC`,
    [userId],
    (err, notifications) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to retrieve notifications' });
      }
      
      console.log(`Found ${notifications.length} notifications for user ${userId}`);
      
      // Log notifications with and without sender information
      const withSender = notifications.filter((n: any) => n.sender_id);
      const withoutSender = notifications.filter((n: any) => !n.sender_id);
      
      console.log(`Notifications with sender_id: ${withSender.length}, without sender_id: ${withoutSender.length}`);
      
      if (withSender.length > 0) {
        const withImage = withSender.filter((n: any) => n.current_sender_image || n.sender_image);
        const withoutImage = withSender.filter((n: any) => !n.current_sender_image && !n.sender_image);
        
        console.log(`Notifications with sender_id and images: ${withImage.length}, without images: ${withoutImage.length}`);
        
        if (withImage.length > 0) {
          const sample = withImage[0] as {
            id: number; 
            sender_id: number; 
            sender_image?: string; 
            current_sender_image?: string;
            sender_username?: string;
          };
          
          console.log('Sample notification with sender and image:', {
            id: sample.id,
            sender_id: sample.sender_id,
            original_sender_image: sample.sender_image,
            current_sender_image: sample.current_sender_image,
            sender_username: sample.sender_username
          });
        }
        
        if (withoutImage.length > 0) {
          const sample = withoutImage[0] as {
            id: number; 
            sender_id: number;
            sender_username?: string;
          };
          
          console.log('Sample notification with sender but no image:', {
            id: sample.id,
            sender_id: sample.sender_id,
            sender_username: sample.sender_username
          });
        }
      }
      
      // Use the current profile image if available, otherwise fall back to stored sender_image
      const processedNotifications = notifications.map((notification: any) => {
        const originalSenderImage = notification.sender_image;
        const currentSenderImage = notification.current_sender_image;
        const finalImage = currentSenderImage || originalSenderImage;
        
        if (originalSenderImage !== finalImage && (originalSenderImage || currentSenderImage)) {
          console.log(`Notification #${notification.id} image updated:`, {
            from: originalSenderImage,
            to: finalImage
          });
        }
        
        return {
          ...notification,
          sender_image: finalImage
        };
      });
      
      res.json(processedNotifications);
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