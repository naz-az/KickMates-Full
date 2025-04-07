import { Request, Response } from 'express';
import db, { getAsync, runAsync, allAsync } from '../db';

// Get conversations for the current user
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    // Get all conversations the user is participating in
    const conversations = await allAsync(`
      SELECT 
        c.id, 
        c.created_at, 
        c.updated_at
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = ?
      ORDER BY c.updated_at DESC
    `, [userId]);

    // For each conversation, get the other participants and latest message
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation: any) => {
        // Get participants
        const participants = await allAsync(`
          SELECT 
            u.id, 
            u.username, 
            u.full_name, 
            u.profile_image
          FROM users u
          JOIN conversation_participants cp ON u.id = cp.user_id
          WHERE cp.conversation_id = ? AND u.id != ?
        `, [conversation.id, userId]);

        // Get latest message
        const latestMessage = await getAsync(`
          SELECT 
            m.id, 
            m.sender_id, 
            m.content, 
            m.is_read, 
            m.created_at,
            u.username as sender_username
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.conversation_id = ?
          ORDER BY m.created_at DESC
          LIMIT 1
        `, [conversation.id]);

        // Get unread count
        const unreadCount = await getAsync(`
          SELECT COUNT(*) as count
          FROM messages
          WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
        `, [conversation.id, userId]);

        // Format the time for display
        let displayTime = '';
        let fullDate = '';
        
        if (latestMessage) {
          const messageDate = new Date(latestMessage.created_at);
          const now = new Date();
          const diffMs = now.getTime() - messageDate.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);
          
          fullDate = messageDate.toISOString();
          
          if (diffMins < 1) {
            displayTime = 'Just now';
          } else if (diffMins < 60) {
            displayTime = `${diffMins} mins ago`;
          } else if (diffHours < 24) {
            displayTime = `${diffHours} hours ago`;
          } else if (diffDays === 1) {
            displayTime = 'Yesterday';
          } else if (diffDays < 7) {
            displayTime = `${diffDays} days ago`;
          } else {
            displayTime = messageDate.toLocaleDateString();
          }
        }

        return {
          id: conversation.id,
          participants,
          lastMessage: latestMessage ? {
            id: latestMessage.id,
            senderId: latestMessage.sender_id,
            senderUsername: latestMessage.sender_username,
            content: latestMessage.content,
            isRead: Boolean(latestMessage.is_read),
            createdAt: latestMessage.created_at,
            fullDate,
            displayTime
          } : null,
          unreadCount: unreadCount ? unreadCount.count : 0,
          createdAt: conversation.created_at,
          updatedAt: conversation.updated_at
        };
      })
    );

    res.json({ conversations: conversationsWithDetails });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Server error while fetching conversations' });
  }
};

// Get messages for a specific conversation
export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    // Check if user is a participant in this conversation
    const participant = await getAsync(`
      SELECT * FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);

    if (!participant) {
      return res.status(403).json({ message: 'You are not a participant in this conversation' });
    }

    // Get messages with like information
    const messages = await allAsync(`
      SELECT 
        m.id, 
        m.sender_id, 
        m.content, 
        m.is_read, 
        m.created_at,
        m.reply_to_id,
        m.reply_to_content,
        m.reply_to_sender,
        u.username as sender_username,
        u.full_name as sender_name,
        u.profile_image as sender_profile_image,
        (
          SELECT COUNT(*)
          FROM message_likes ml
          WHERE ml.message_id = m.id
        ) as likes,
        (
          SELECT COUNT(*)
          FROM message_likes ml
          WHERE ml.message_id = m.id AND ml.user_id = ?
        ) as is_liked
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `, [userId, conversationId]);

    // Mark messages as read
    await runAsync(`
      UPDATE messages
      SET is_read = 1
      WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
    `, [conversationId, userId]);

    // Format messages before sending to client
    const formattedMessages = messages.map(message => {
      const date = new Date(message.created_at);
      const today = new Date();
      
      let dateGroup;
      if (date.toDateString() === today.toDateString()) {
        dateGroup = 'Today';
      } else {
        dateGroup = date.toLocaleDateString();
      }
      
      return {
        id: message.id,
        senderId: message.sender_id,
        senderUsername: message.sender_username,
        senderName: message.sender_name,
        senderProfileImage: message.sender_profile_image,
        content: message.content,
        isRead: Boolean(message.is_read),
        createdAt: message.created_at,
        replyToId: message.reply_to_id,
        replyToContent: message.reply_to_content,
        replyToSender: message.reply_to_sender,
        isLiked: Boolean(message.is_liked),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: dateGroup
      };
    });

    res.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Server error while getting messages' });
  }
};

// Send a new message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { content, replyToId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Check if user is a participant in this conversation
    const participant = await getAsync(`
      SELECT * FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);

    if (!participant) {
      return res.status(403).json({ message: 'You are not a participant in this conversation' });
    }
    
    // Fetch reply context if replyToId is provided
    let replyToContent: string | null = null;
    let replyToSender: string | null = null;
    
    if (replyToId) {
      const originalMessage = await getAsync(`
        SELECT m.content, u.full_name as senderName
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ? AND m.conversation_id = ?
      `, [replyToId, conversationId]);
      
      if (originalMessage) {
        replyToContent = originalMessage.content;
        replyToSender = originalMessage.senderName;
      } else {
        console.warn(`Original message for reply (ID: ${replyToId}) not found or not in the same conversation.`);
      }
    }

    // Insert the new message
    const result = await runAsync(`
      INSERT INTO messages (conversation_id, sender_id, content, reply_to_id, reply_to_content, reply_to_sender)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [conversationId, userId, content.trim(), replyToId || null, replyToContent, replyToSender]);
    
    // Get the inserted message ID
    const messageId = result.lastID;
    
    // Update the conversation's updated_at timestamp
    await runAsync(`
      UPDATE conversations
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [conversationId]);
    
    // Fetch the complete message with sender info
    const newMessage = await getAsync(`
      SELECT 
        m.id, 
        m.sender_id, 
        m.content, 
        m.is_read, 
        m.created_at,
        m.reply_to_id,
        m.reply_to_content,
        m.reply_to_sender,
        u.username as sender_username,
        u.full_name as sender_name,
        u.profile_image as sender_profile_image
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [messageId]);
    
    // Format the message
    const date = new Date(newMessage.created_at);
    const today = new Date();
    
    let dateGroup;
    if (date.toDateString() === today.toDateString()) {
      dateGroup = 'Today';
    } else {
      dateGroup = date.toLocaleDateString();
    }
    
    const formattedMessage = {
      id: newMessage.id,
      senderId: newMessage.sender_id,
      senderUsername: newMessage.sender_username,
      senderName: newMessage.sender_name,
      senderProfileImage: newMessage.sender_profile_image,
      content: newMessage.content,
      isRead: Boolean(newMessage.is_read),
      createdAt: newMessage.created_at,
      replyToId: newMessage.reply_to_id,
      replyToContent: newMessage.reply_to_content,
      replyToSender: newMessage.reply_to_sender,
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: dateGroup
    };
    
    // Return success response
    res.status(201).json({
      message: 'Message sent successfully',
      data: formattedMessage
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error while sending message' });
  }
};

// Create a new conversation
export const createConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    // Accept both participants and participantIds for backwards compatibility
    const { participants, participantIds } = req.body;
    
    // Use whichever field is provided (participants takes precedence)
    const userIds = participants || participantIds;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'At least one participant is required' });
    }

    // Add current user to participants if not already included
    if (!userIds.includes(userId)) {
      userIds.push(userId);
    }

    // Check if all participants exist
    for (const participantId of userIds) {
      const user = await getAsync(`SELECT id FROM users WHERE id = ?`, [participantId]);
      if (!user) {
        return res.status(404).json({ message: `User with ID ${participantId} not found` });
      }
    }

    // Check if a conversation with exactly these participants already exists
    if (userIds.length === 2) {
      const existingConversation = await getAsync(`
        SELECT c.id
        FROM conversations c
        WHERE (
          SELECT COUNT(*) FROM conversation_participants
          WHERE conversation_id = c.id
        ) = 2
        AND EXISTS (
          SELECT 1 FROM conversation_participants
          WHERE conversation_id = c.id AND user_id = ?
        )
        AND EXISTS (
          SELECT 1 FROM conversation_participants
          WHERE conversation_id = c.id AND user_id = ?
        )
      `, [userIds[0], userIds[1]]);

      if (existingConversation) {
        // Return existing conversation
        return res.json({ conversationId: existingConversation.id });
      }
    }

    // Create new conversation
    const conversationResult = await runAsync(`
      INSERT INTO conversations DEFAULT VALUES
    `);

    const conversationId = conversationResult.lastID;

    // Add participants
    for (const participantId of userIds) {
      await runAsync(`
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES (?, ?)
      `, [conversationId, participantId]);
    }

    res.status(201).json({ conversationId });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Server error while creating conversation' });
  }
};

// Get conversation details
export const getConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    // Check if user is a participant in this conversation
    const participant = await getAsync(`
      SELECT * FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);

    if (!participant) {
      return res.status(403).json({ message: 'You are not a participant in this conversation' });
    }

    // Get conversation details
    const conversation = await getAsync(`
      SELECT id, created_at, updated_at
      FROM conversations
      WHERE id = ?
    `, [conversationId]);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Get participants
    const participants = await allAsync(`
      SELECT 
        u.id, 
        u.username, 
        u.full_name, 
        u.profile_image
      FROM users u
      JOIN conversation_participants cp ON u.id = cp.user_id
      WHERE cp.conversation_id = ?
    `, [conversationId]);

    res.json({
      conversation: {
        id: conversation.id,
        participants,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at
      }
    });
  } catch (error) {
    console.error('Error getting conversation details:', error);
    res.status(500).json({ message: 'Server error while fetching conversation details' });
  }
};

// Delete a message
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { conversationId, messageId } = req.params;

    // First verify the user is a participant in this conversation
    const participant = await getAsync(`
      SELECT * FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);

    if (!participant) {
      return res.status(403).json({ message: 'You are not a participant in this conversation' });
    }

    // Check if the message exists and belongs to the user
    const message = await getAsync(`
      SELECT * FROM messages
      WHERE id = ? AND conversation_id = ?
    `, [messageId, conversationId]);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify the user is the sender of the message
    if (message.sender_id !== userId) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    // Delete the message
    await runAsync(`
      DELETE FROM messages
      WHERE id = ? AND sender_id = ?
    `, [messageId, userId]);

    // Return success
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error while deleting message' });
  }
};

// Like a message
export const likeMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { conversationId, messageId } = req.params;

    // Check if user is a participant in this conversation
    const participant = await getAsync(`
      SELECT * FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);

    if (!participant) {
      return res.status(403).json({ message: 'You are not a participant in this conversation' });
    }

    // Check if the message exists
    const message = await getAsync(`
      SELECT * FROM messages
      WHERE id = ? AND conversation_id = ?
    `, [messageId, conversationId]);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user already liked the message
    const existingLike = await getAsync(`
      SELECT * FROM message_likes
      WHERE message_id = ? AND user_id = ?
    `, [messageId, userId]);

    if (existingLike) {
      return res.status(400).json({ message: 'You have already liked this message' });
    }

    // Add like
    await runAsync(`
      INSERT INTO message_likes (message_id, user_id)
      VALUES (?, ?)
    `, [messageId, userId]);

    // Get updated like count
    const likeCount = await getAsync(`
      SELECT COUNT(*) as count
      FROM message_likes
      WHERE message_id = ?
    `, [messageId]);

    res.json({ 
      message: 'Message liked successfully',
      likes: likeCount.count
    });
  } catch (error) {
    console.error('Error liking message:', error);
    res.status(500).json({ message: 'Server error while liking message' });
  }
};

// Unlike a message
export const unlikeMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { conversationId, messageId } = req.params;

    // Check if user is a participant in this conversation
    const participant = await getAsync(`
      SELECT * FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);

    if (!participant) {
      return res.status(403).json({ message: 'You are not a participant in this conversation' });
    }

    // Check if the message exists
    const message = await getAsync(`
      SELECT * FROM messages
      WHERE id = ? AND conversation_id = ?
    `, [messageId, conversationId]);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Remove like
    await runAsync(`
      DELETE FROM message_likes
      WHERE message_id = ? AND user_id = ?
    `, [messageId, userId]);

    // Get updated like count
    const likeCount = await getAsync(`
      SELECT COUNT(*) as count
      FROM message_likes
      WHERE message_id = ?
    `, [messageId]);

    res.json({ 
      message: 'Message unliked successfully',
      likes: likeCount.count
    });
  } catch (error) {
    console.error('Error unliking message:', error);
    res.status(500).json({ message: 'Server error while unliking message' });
  }
}; 