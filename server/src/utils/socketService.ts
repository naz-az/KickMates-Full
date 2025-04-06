import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { runAsync, getAsync, allAsync } from '../db';

interface UserSocketMap {
  [userId: string]: string; // Maps user ID to socket ID
}

interface ParticipantRecord {
  user_id: number;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private userSockets: UserSocketMap = {};

  // Initialize socket server with HTTP server
  initialize(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*', // In production, set this to your frontend URL
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', this.handleConnection.bind(this));

    console.log('Socket.IO service initialized');
  }

  // Handle new socket connections
  private handleConnection(socket: Socket) {
    console.log(`New socket connection: ${socket.id}`);

    // Authenticate user
    socket.on('authenticate', (data: { userId: string, token: string }) => {
      // In a real app, verify the token here
      this.userSockets[data.userId] = socket.id;
      console.log(`User ${data.userId} authenticated with socket ${socket.id}`);
      
      // Join user to their own room for private messages
      socket.join(`user:${data.userId}`);
    });

    // Handle joining a conversation room
    socket.on('join-conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Handle leaving a conversation room
    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    // Handle new messages
    socket.on('send-message', async (data: { 
      conversationId: string,
      content: string,
      senderId: number,
      replyToId?: number
    }) => {
      try {
        const { conversationId, content, senderId, replyToId } = data;
        
        // Get reply information if needed
        let replyToContent = null;
        let replyToSender = null;
        
        if (replyToId) {
          const replyMsg = await getAsync(`
            SELECT m.content, u.full_name as senderName
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?
          `, [replyToId]);
          
          if (replyMsg) {
            replyToContent = replyMsg.content;
            replyToSender = replyMsg.senderName;
          }
        }
        
        // Insert new message into database
        const result = await runAsync(`
          INSERT INTO messages (conversation_id, sender_id, content, reply_to_id, reply_to_content, reply_to_sender)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [conversationId, senderId, content.trim(), replyToId || null, replyToContent, replyToSender]);
        
        // Get the inserted message ID
        const messageId = result.lastID;
        
        // Fetch the complete message with sender details
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
        const formattedMessage = {
          id: newMessage.id,
          senderId: newMessage.sender_id,
          senderUsername: newMessage.sender_username,
          senderName: newMessage.sender_name,
          senderProfileImage: newMessage.sender_profile_image,
          content: newMessage.content,
          isRead: false,
          createdAt: newMessage.created_at,
          replyToId: newMessage.reply_to_id,
          replyToContent: newMessage.reply_to_content,
          replyToSender: newMessage.reply_to_sender,
          time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: 'Today'
        };
        
        // Broadcast the message to all users in the conversation
        this.io?.to(`conversation:${conversationId}`).emit('new-message', formattedMessage);
        
        // Update conversation's updated_at timestamp
        await runAsync(`
          UPDATE conversations
          SET updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [conversationId]);
        
        // Get all participants in this conversation
        const participants = await this.getConversationParticipants(conversationId);
        
        // Send notification to other participants who aren't in the room
        participants.forEach(participant => {
          if (participant !== senderId.toString()) {
            // Emit to the user's own room so they get a notification
            this.io?.to(`user:${participant}`).emit('conversation-updated', {
              conversationId,
              lastMessage: formattedMessage
            });
          }
        });
        
      } catch (error) {
        console.error('Error handling send-message event:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message read status
    socket.on('mark-messages-read', async (data: { conversationId: string, userId: number }) => {
      try {
        const { conversationId, userId } = data;
        
        await runAsync(`
          UPDATE messages
          SET is_read = 1
          WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
        `, [conversationId, userId]);
        
        // Broadcast that messages were read
        this.io?.to(`conversation:${conversationId}`).emit('messages-read', {
          conversationId,
          userId
        });
        
      } catch (error) {
        console.error('Error handling mark-messages-read event:', error);
      }
    });

    // Handle disconnections
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Remove this socket from userSockets
      for (const userId in this.userSockets) {
        if (this.userSockets[userId] === socket.id) {
          delete this.userSockets[userId];
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  }

  // Helper to get all participants in a conversation
  private async getConversationParticipants(conversationId: string): Promise<string[]> {
    try {
      const participants = await this.getParticipantsFromDb(conversationId);
      return participants.map((p: ParticipantRecord) => p.user_id.toString());
    } catch (error) {
      console.error('Error getting conversation participants:', error);
      return [];
    }
  }

  // Fetch participants from database
  private async getParticipantsFromDb(conversationId: string) {
    return await allAsync(
      `SELECT user_id FROM conversation_participants WHERE conversation_id = ?`,
      [conversationId]
    );
  }
}

// Create and export a singleton instance
export const socketService = new SocketService(); 