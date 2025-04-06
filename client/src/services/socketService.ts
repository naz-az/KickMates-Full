import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

const SOCKET_URL = 'http://localhost:5001';

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers: Array<(message: any) => void> = [];
  private conversationUpdateHandlers: Array<(data: any) => void> = [];
  private messagesReadHandlers: Array<(data: any) => void> = [];
  private isConnected = false;

  constructor() {
    this.socket = null;
  }

  // Connect to socket server and authenticate
  connect(userId: string, token: string) {
    if (this.socket && this.isConnected) {
      return; // Already connected
    }

    this.socket = io(SOCKET_URL);

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;

      // Send authentication immediately after connection
      this.socket.emit('authenticate', { userId, token });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('new-message', (message) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('conversation-updated', (data) => {
      this.conversationUpdateHandlers.forEach(handler => handler(data));
    });

    this.socket.on('messages-read', (data) => {
      this.messagesReadHandlers.forEach(handler => handler(data));
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  // Disconnect from socket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join conversation room
  joinConversation(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-conversation', conversationId);
    }
  }

  // Leave conversation room
  leaveConversation(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-conversation', conversationId);
    }
  }

  // Send a message to a conversation
  sendMessage(data: { conversationId: string, content: string, senderId: number, replyToId?: number }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send-message', data);
    } else {
      console.error('Socket not connected. Cannot send message.');
    }
  }

  // Mark messages as read
  markMessagesRead(conversationId: string, userId: number) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark-messages-read', { conversationId, userId });
    }
  }

  // Add a message handler
  onNewMessage(handler: (message: any) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  // Add a conversation update handler
  onConversationUpdated(handler: (data: any) => void) {
    this.conversationUpdateHandlers.push(handler);
    return () => {
      this.conversationUpdateHandlers = this.conversationUpdateHandlers.filter(h => h !== handler);
    };
  }

  // Add a messages read handler
  onMessagesRead(handler: (data: any) => void) {
    this.messagesReadHandlers.push(handler);
    return () => {
      this.messagesReadHandlers = this.messagesReadHandlers.filter(h => h !== handler);
    };
  }

  // Check if socket is connected
  isSocketConnected() {
    return this.isConnected;
  }
}

// Hook for using the socket service in components
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(socketService.isSocketConnected());
    };
    
    // Check initial connection
    checkConnection();
    
    // Set up interval to check connection status
    const intervalId = setInterval(checkConnection, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  return {
    socketService,
    isConnected
  };
};

// Create singleton instance
export const socketService = new SocketService(); 