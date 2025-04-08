import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getConversations, getMessages, sendMessage, deleteMessage, getAllUsers, createConversation, likeMessage, unlikeMessage } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { socketService, useSocket } from '../services/socketService';
import { formatImageUrl } from '../utils/imageUtils';

// Message types
interface Contact {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  isGroup: boolean;
  participants: ConversationParticipant[];
}

interface ConversationParticipant {
  id: number;
  username: string;
  full_name: string;
  profile_image: string;
}

interface Conversation {
  id: number;
  participants: ConversationParticipant[];
  lastMessage: {
    id: number;
    senderId: number;
    senderUsername: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    displayTime: string;
  } | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface MessageData {
  id: number;
  senderId: number;
  senderUsername: string;
  senderName: string;
  senderProfileImage: string;
  content: string;
  isRead: boolean;
  time: string;
  date: string;
  isLiked?: boolean;
  isDeleted?: boolean;
  replyToId?: number | null;
  replyToContent?: string | null;
  replyToSender?: string | null;
  createdAt: string;
}

interface UserOption {
  id: number;
  username: string;
  full_name: string;
  profile_image: string;
}

const MessagesPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [activeConversation, setActiveConversation] = useState<number | null>(
    conversationId ? parseInt(conversationId) : null
  );
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  // Track if scroll is needed (only for new messages, not initial load)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);

  // New state for WhatsApp-like features
  const [replyingTo, setReplyingTo] = useState<MessageData | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [actionMenuPosition, setActionMenuPosition] = useState<{top: number, left: number} | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { isConnected } = useSocket();

  // New state for creating conversation
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Function to handle profile image clicks
  const handleProfileClick = (userId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering other click events
    navigate(`/members/${userId}`);
  };

  // Get user ID from context
  useEffect(() => {
    if (user) {
      setUserId(Number(user.id));
      setUserProfileImage(user.profile_image || null);
      // console.log('Loaded userId from context:', Number(user.id));
    }
  }, [user]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await getConversations();
        setConversations(response.data.conversations);
        
        // If no active conversation is set but we have conversations, set the first one active
        if (!activeConversation && response.data.conversations.length > 0) {
          setActiveConversation(response.data.conversations[0].id);
          navigate(`/messages/${response.data.conversations[0].id}`);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    };

    fetchConversations();
  }, [activeConversation, navigate]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation) return;
      
      try {
        setLoadingMessages(true);
        const response = await getMessages(activeConversation);
        // console.log('Messages data:', response.data.messages);
        setMessages(response.data.messages || []);
        setLoadingMessages(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeConversation]);

  // Scroll to bottom of messages when they change
  useEffect(() => {
    if (messageEndRef.current && shouldScrollToBottom) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldScrollToBottom(false);
    }
  }, [messages, shouldScrollToBottom]);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    const participantNames = conversation.participants
      .map(p => p.full_name || p.username)
      .join(' ');
    
    return participantNames.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get current active conversation data
  const activeConversationData = conversations.find(conversation => conversation.id === activeConversation);
  
  // Format conversations into contacts for display
  const contacts: Contact[] = filteredConversations.map(conversation => {
    // Get the first participant's name and image
    const participant = conversation.participants[0];
    
    // Create a display name based on number of participants
    let displayName = '';
    if (conversation.participants.length === 0) {
      displayName = 'No participants';
    } else if (conversation.participants.length === 1) {
      displayName = participant.full_name || participant.username;
    } else {
      // For group conversations, show names of all participants
      displayName = conversation.participants
        .map(p => p.full_name || p.username)
        .join(', ');
    }
    
    return {
      id: conversation.id,
      name: displayName,
      avatar: participant.profile_image || 'https://i.pravatar.cc/150?u=user' + participant.id,
      lastMessage: conversation.lastMessage ? conversation.lastMessage.content : 'No messages yet',
      time: conversation.lastMessage ? conversation.lastMessage.displayTime : 'Never',
      unread: conversation.unreadCount,
      online: Math.random() > 0.5, // Random online status for demo
      isGroup: conversation.participants.length > 1,
      participants: conversation.participants
    };
  });

  // Mark messages as read when selecting a contact
  const handleSelectContact = (contactId: number) => {
    setActiveConversation(contactId);
    navigate(`/messages/${contactId}`);
    
    // Update conversations to mark messages as read locally
    setConversations(prevConversations => 
      prevConversations.map(conversation => 
        conversation.id === contactId ? { ...conversation, unreadCount: 0 } : conversation
      )
    );
  };

  // Send a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeConversation || !messageInput.trim()) return;
    
    try {
      const currentUserId = user?.id ? Number(user.id) : Number(userId);
      
      // Optimistically add the message to UI
      const newMessage: MessageData = {
        id: Date.now(), // Temporary ID
        senderId: currentUserId,
        senderUsername: user?.username || 'me',
        senderName: user?.full_name || 'Me',
        senderProfileImage: user?.profile_image || '',
        content: messageInput.trim(),
        isRead: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: 'Today',
        // Add reply data if replying to a message
        replyToId: replyingTo ? replyingTo.id : null,
        replyToContent: replyingTo ? replyingTo.content : null,
        replyToSender: replyingTo ? replyingTo.senderName : null,
        createdAt: new Date().toISOString() // Add proper ISO timestamp for consistent sorting
      };
      
      // Store message content before clearing
      const messageContent = messageInput.trim();
      
      // Clear input early for better UX
      setMessageInput('');
      // Clear reply state
      setReplyingTo(null);
      
      setMessages(prev => [...prev, newMessage]);
      // Set scroll to bottom when user sends a new message
      setShouldScrollToBottom(true);
      
      // Update last message in conversations for UI
      setConversations(prevConversations => 
        prevConversations.map(conversation => 
          conversation.id === activeConversation
            ? { 
                ...conversation, 
                lastMessage: conversation.lastMessage 
                  ? {
                      ...conversation.lastMessage,
                      content: messageContent,
                      displayTime: 'Just now'
                    }
                  : {
                      id: Date.now(),
                      senderId: currentUserId,
                      senderUsername: 'me',
                      content: messageContent,
                      isRead: false,
                      createdAt: new Date().toISOString(),
                      displayTime: 'Just now'
                    }
              } 
            : conversation
        )
      );
      
      // Use WebSocket for real-time delivery if connected
      if (isConnected) {
        socketService.sendMessage({
          conversationId: activeConversation.toString(),
          content: messageContent,
          senderId: currentUserId,
          replyToId: replyingTo?.id
        });
      } else {
        // Fallback to REST API if socket is not connected
        await sendMessage(activeConversation, messageContent, replyingTo?.id);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Revert the optimistic update if there's an error
      setMessages(prev => prev.filter(msg => msg.id !== Date.now()));
    }
  };

  // Group messages by date
  const groupedMessages = messages?.reduce<Record<string, MessageData[]>>((groups, message) => {
    if (!message) return groups;
    const date = message.date || 'Unknown';
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {}) || {};
  
  // Ensure messages within each date group are properly sorted by creation time
  // This fixes the issue where replies appear out of order after page refresh
  Object.keys(groupedMessages || {}).forEach(date => {
    groupedMessages[date]?.sort((a, b) => {
      // Sort by message ID (sequential) instead of timestamps
      return a.id - b.id;
    });
  });

  // Get total unread messages count
  const totalUnread = conversations?.reduce((count, conversation) => count + conversation.unreadCount, 0) || 0;

  // New handlers for WhatsApp-like features
  
  // Handle long press or right-click to show context menu
  const handleMessageContextMenu = (e: React.MouseEvent, message: MessageData) => {
    e.preventDefault();
    setSelectedMessage(message.id);
    setActionMenuPosition({ top: e.clientY, left: e.clientX });
    setShowContextMenu(true);
  };

  // Handle clicking outside of context menu to close it
  useEffect(() => {
    const handleClickOutside = () => {
      setShowContextMenu(false);
      setActionMenuPosition(null);
    };
    
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showContextMenu]);

  // Reply to a message
  const handleReplyMessage = (message: MessageData) => {
    setReplyingTo(message);
    setShowContextMenu(false);
    // Focus the input field
    document.querySelector<HTMLInputElement>('.message-input')?.focus();
  };

  // Like a message
  const handleLikeMessage = (messageId: number) => {
    // Find the message to determine if it's currently liked or not
    const message = messages.find(msg => msg.id === messageId);
    
    if (!message || !activeConversation) return;
    
    // Optimistically update UI
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isLiked: !msg.isLiked } : msg
    ));
    
    // Call the appropriate API based on current like status
    if (message.isLiked) {
      // If already liked, unlike it
      unlikeMessage(activeConversation, messageId)
        .catch(err => {
          console.error('Error unliking message:', err);
          // Revert UI change on error
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, isLiked: true } : msg
          ));
        });
    } else {
      // If not liked, like it
      likeMessage(activeConversation, messageId)
        .catch(err => {
          console.error('Error liking message:', err);
          // Revert UI change on error
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, isLiked: false } : msg
          ));
        });
    }
    
    setShowContextMenu(false);
  };

  // Delete a message
  const handleDeleteMessage = async (messageId: number) => {
    // Find the message to check ownership
    const messageToDelete = messages.find(msg => msg.id === messageId);
    
    // Only allow deleting if the user is the sender
    if (messageToDelete && messageToDelete.senderId === userId) {
      try {
        // Optimistically update UI first
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isDeleted: true, content: 'This message was deleted' } : msg
    ));
    setShowContextMenu(false);
        
        // Call API to delete the message
        if (activeConversation) {
          await deleteMessage(activeConversation, messageId);
          console.log('Message deleted successfully on the server');
        }
      } catch (error) {
        console.error('Error deleting message:', error);
        // Revert the optimistic update if there's an error
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        alert('Failed to delete message. Please try again.');
      }
    } else {
      console.warn('Cannot delete message: user is not the sender');
      setShowContextMenu(false);
    }
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Toggle emoji picker
  const handleToggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: any) => {
    setMessageInput(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  // Handle voice recording
  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    
    // Start timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    // In a real app, you would start the actual recording here
    console.log("Started recording...");
  };
  
  const stopRecording = () => {
    setIsRecording(false);
    
    // Clear timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // In a real app, you would stop the recording and send the voice message
    console.log(`Stopped recording after ${recordingTime} seconds`);
    
    // Simulate sending a voice message
    if (recordingTime > 0 && activeConversation) {
      const currentUserId = user?.id ? Number(user.id) : Number(userId);
      
      const newMessage: MessageData = {
        id: Date.now(),
        senderId: currentUserId,
        senderUsername: user?.username || 'me',
        senderName: user?.full_name || 'Me',
        senderProfileImage: user?.profile_image || '',
        content: `🎤 Voice message (${formatTime(recordingTime)})`,
        isRead: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: 'Today',
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMessage]);
    }
  };
  
  const cancelRecording = () => {
    setIsRecording(false);
    
    // Clear timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    console.log("Cancelled recording");
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Add this inside the useEffect that runs when activeConversation changes
  useEffect(() => {
    if (activeConversation && user) {
      // Join conversation room for real-time messages
      socketService.joinConversation(activeConversation.toString());
      
      // Mark messages as read
      socketService.markMessagesRead(activeConversation.toString(), user.id);
      
      // Clean up when leaving conversation
      return () => {
        socketService.leaveConversation(activeConversation.toString());
      };
    }
  }, [activeConversation, user]);

  // Add this new useEffect for handling incoming messages
  useEffect(() => {
    if (!user) return;
    
    // Set up socket event listeners
    const newMessageHandler = (message: any) => {
      if (message.senderId !== user.id) {
        // Add incoming message to the messages list
        setMessages(prev => [...prev, message]);
        
        // Update conversations list with the new message
        if (activeConversation && activeConversation.toString() === message.conversationId) {
          // Mark message as read since user is in the conversation
          socketService.markMessagesRead(message.conversationId, user.id);
        } else {
          // Update conversation with unread message
          setConversations(prevConversations => 
            prevConversations.map(conversation => 
              conversation.id.toString() === message.conversationId
                ? {
                    ...conversation,
                    lastMessage: {
                      id: message.id,
                      senderId: message.senderId,
                      senderUsername: message.senderUsername,
                      content: message.content,
                      isRead: false,
                      createdAt: message.createdAt,
                      displayTime: 'Just now'
                    },
                    unreadCount: conversation.unreadCount + 1
                  }
                : conversation
            )
          );
        }
        
        // Scroll to bottom if already at bottom
        if (activeConversation && activeConversation.toString() === message.conversationId) {
          setShouldScrollToBottom(true);
        }
      }
    };
    
    const messagesReadHandler = (data: { conversationId: string, userId: number }) => {
      if (data.userId !== user.id) {
        // Update messages to show they've been read
        setMessages(prev => 
          prev.map(msg => 
            msg.senderId === user.id ? { ...msg, isRead: true } : msg
          )
        );
        
        // Update conversation to show messages are read
        setConversations(prevConversations => 
          prevConversations.map(conversation => 
            conversation.id.toString() === data.conversationId
            ? {
                ...conversation,
                lastMessage: conversation.lastMessage
                  ? { ...conversation.lastMessage, isRead: true }
                  : null,
                unreadCount: 0
              }
            : conversation
          )
        );
      }
    };
    
    const conversationUpdatedHandler = (data: { conversationId: string, lastMessage: any }) => {
      // Update conversation list with the latest message
      setConversations(prevConversations => 
        prevConversations.map(conversation => 
          conversation.id.toString() === data.conversationId
            ? {
                ...conversation,
                lastMessage: {
                  id: data.lastMessage.id,
                  senderId: data.lastMessage.senderId,
                  senderUsername: data.lastMessage.senderUsername,
                  content: data.lastMessage.content,
                  isRead: false,
                  createdAt: data.lastMessage.createdAt,
                  displayTime: 'Just now'
                },
                unreadCount: conversation.unreadCount + 1
              }
            : conversation
        )
      );
    };
    
    // Register event handlers
    const removeNewMessageHandler = socketService.onNewMessage(newMessageHandler);
    const removeMessagesReadHandler = socketService.onMessagesRead(messagesReadHandler);
    const removeConversationUpdatedHandler = socketService.onConversationUpdated(conversationUpdatedHandler);
    
    return () => {
      // Clean up event handlers
      removeNewMessageHandler();
      removeMessagesReadHandler();
      removeConversationUpdatedHandler();
    };
  }, [user, activeConversation]);

  // Fetch all users for recipient selection
  useEffect(() => {
    if (showNewMessageModal) {
      const fetchUsers = async () => {
        try {
          setIsLoadingUsers(true);
          const response = await getAllUsers();
          console.log('All users response:', response.data);
          
          // Make sure we have users and it's an array
          if (response.data && response.data.users && Array.isArray(response.data.users)) {
            // Filter out current user from the list
            const filteredUsersList = response.data.users.filter(
              (u: UserOption) => u.id !== Number(user?.id)
            );
            setAllUsers(filteredUsersList);
            setFilteredUsers(filteredUsersList);
          } else {
            console.error('Invalid users data format', response.data);
            setAllUsers([]);
            setFilteredUsers([]);
          }
          setIsLoadingUsers(false);
        } catch (error) {
          console.error('Error fetching users:', error);
          setIsLoadingUsers(false);
          setAllUsers([]);
          setFilteredUsers([]);
        }
      };
      
      fetchUsers();
    }
  }, [showNewMessageModal, user?.id]);

  // Filter users based on search query
  useEffect(() => {
    if (userSearchQuery.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      const lowercaseQuery = userSearchQuery.toLowerCase();
      const filtered = allUsers.filter(
        u => 
          u.username.toLowerCase().includes(lowercaseQuery) || 
          (u.full_name && u.full_name.toLowerCase().includes(lowercaseQuery))
      );
      setFilteredUsers(filtered);
    }
  }, [userSearchQuery, allUsers]);

  // Handle selecting a user as recipient
  const handleSelectUser = (selectedUser: UserOption) => {
    // Check if user is already selected
    if (!selectedUsers.some(u => u.id === selectedUser.id)) {
      setSelectedUsers([...selectedUsers, selectedUser]);
    }
    setUserSearchQuery(''); // Clear search after selection
  };

  // Handle removing a selected user
  const handleRemoveUser = (userId: number) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  // Handle creating a new conversation
  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      // Make sure we're sending numeric IDs
      const participantIds = selectedUsers.map(u => Number(u.id));
      
      console.log('Creating conversation with participants:', participantIds);
      
      // Include current user in participants if not already included
      if (userId && !participantIds.includes(userId)) {
        console.log('Adding current user to participants:', userId);
        participantIds.push(userId);
      }
      
      console.log('Final participants list:', participantIds);
      
      const response = await createConversation(participantIds);
      console.log('Conversation creation response:', response.data);
      
      // Close the modal
      setShowNewMessageModal(false);
      setSelectedUsers([]);
      
      // Navigate to the new conversation
      const newConversationId = response.data.conversationId;
      
      if (!newConversationId) {
        console.error('No conversation ID returned from server');
        alert('Failed to create conversation. Please try again.');
        return;
      }
      
      // Navigate to the new conversation
      navigate(`/messages/${newConversationId}`);
      
      // Refresh conversations list
      const conversationsResponse = await getConversations();
      setConversations(conversationsResponse.data.conversations);
      
      // Set the active conversation
      setActiveConversation(newConversationId);
      
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      
      // Add more detailed error info
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        if (error.response.data && error.response.data.message) {
          alert(`Failed to create conversation: ${error.response.data.message}`);
          return;
        }
      }
      
      alert('Failed to create conversation. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col p-8">
      <style>
        {`
        .cursor-pointer {
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }
        .cursor-pointer:hover {
          transform: scale(1.1);
          opacity: 0.9;
        }
        
        /* Fixed height chat container styles */
        .chat-container {
          flex: 1;
          display: flex;
          width: 100%;
          height: 100%;
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }
        
        .chat-sidebar {
          width: 300px;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: white;
        }
        
        .chat-sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .chat-sidebar-title {
          display: flex;
          align-items: center;
          font-weight: 600;
          font-size: 1.125rem;
        }
        
        .chat-sidebar-title svg {
          margin-right: 0.5rem;
        }
        
        .chat-sidebar-search {
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .chat-sidebar-search-input {
          width: 100%;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          border: 1px solid #e5e7eb;
          font-size: 0.875rem;
          outline: none;
        }
        
        .chat-sidebar-search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
        
        .chat-conversation-item {
          display: flex;
          padding: 0.75rem;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s;
          cursor: pointer;
        }
        
        .chat-conversation-item:hover {
          background-color: #f9fafb;
        }
        
        .chat-conversation-item.active {
          background-color: #f3f4f6;
        }
        
        .chat-avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 9999px;
          object-fit: cover;
        }
        
        .chat-avatar.online::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: 0;
          width: 0.75rem;
          height: 0.75rem;
          background-color: #10b981;
          border-radius: 9999px;
          border: 2px solid white;
        }
        
        /* Styles for group conversation avatars */
        .avatar-group {
          display: flex;
          margin-right: 0.5rem;
        }
        
        .avatar-group-item {
          width: 2rem;
          height: 2rem;
          border-radius: 9999px;
          border: 2px solid white;
          object-fit: cover;
        }
        
        .avatar-group-more {
          width: 2rem;
          height: 2rem;
          border-radius: 9999px;
          background-color: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          color: #4b5563;
          border: 2px solid white;
        }
        
        .chat-user-info {
          flex: 1;
          margin-left: 0.75rem;
          overflow: hidden;
        }
        
        .chat-username {
          font-weight: 500;
          color: #111827;
        }
        
        .chat-preview {
          color: #6b7280;
          font-size: 0.875rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .chat-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          margin-left: 0.5rem;
        }
        
        .chat-time {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        
        .chat-badge {
          margin-top: 0.25rem;
          background-color: #3b82f6;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .chat-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background-color: white;
        }
        
        .chat-user {
          display: flex;
          align-items: center;
        }
        
        .chat-user > div {
          margin-left: 0.75rem;
        }
        
        .chat-user-status {
          color: #10b981;
          font-size: 0.75rem;
          margin-top: 0.125rem;
        }
        
        .chat-actions {
          display: flex;
        }
        
        .chat-action-button {
          padding: 0.5rem;
          border-radius: 9999px;
          transition: background-color 0.2s;
          color: #6b7280;
        }
        
        .chat-action-button:hover {
          background-color: #f3f4f6;
          color: #3b82f6;
        }
        
        .chat-conversations {
          flex: 1;
          overflow-y: auto;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          background-color: #f9fafb;
        }
        
        .message-group {
          margin-bottom: 1.5rem;
        }
        
        .chat-footer {
          border-top: 1px solid #e5e7eb;
          padding: 0.75rem 1.5rem;
          background-color: white;
        }
        
        .message-form {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .message-input {
          flex: 1;
          padding: 0.625rem 1rem;
          border-radius: 9999px;
          border: 1px solid #e5e7eb;
          font-size: 0.875rem;
          outline: none;
        }
        
        .message-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
        
        .message-send-button {
          padding: 0.625rem;
          background-color: #3b82f6;
          color: white;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        
        .message-send-button:hover {
          background-color: #2563eb;
        }
        
        .message-send-button:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }
        
        /* Styles for new message modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 50;
        }
        
        .modal-content {
          background-color: white;
          border-radius: 0.5rem;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .modal-header {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-body {
          padding: 1rem;
        }
        
        .modal-footer {
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
        }
        
        .user-option {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 0.25rem;
        }
        
        .user-option:hover {
          background-color: #f3f4f6;
        }
        
        .selected-users {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .selected-user-tag {
          display: flex;
          align-items: center;
          background-color: #e5e7eb;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.875rem;
        }
        
        .user-avatar {
          width: 2rem;
          height: 2rem;
          border-radius: 9999px;
          object-fit: cover;
          margin-right: 0.5rem;
        }
        
        .loading-spinner {
          display: flex;
          justify-content: center;
          padding: 1rem;
        }
        `}
      </style>
      
      <div className="chat-container">
        {/* Chat Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2 className="chat-sidebar-title">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Messages
            </h2>
            <div className="flex items-center">
              {totalUnread > 0 && (
                <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2">
                  {totalUnread}
                </span>
              )}
              <button 
                onClick={() => setShowNewMessageModal(true)}
                className="p-1 bg-primary text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="chat-sidebar-search">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..." 
              className="chat-sidebar-search-input"
            />
          </div>
          
          <div className="chat-conversations">
            {contacts.length > 0 ? (
              contacts.map(contact => (
                <div 
                  key={contact.id}
                  className={`chat-conversation-item ${contact.id === activeConversation ? 'active' : ''}`}
                  onClick={() => handleSelectContact(contact.id)}
                >
                  <div className="relative">
                    {contact.isGroup ? (
                      <div className="flex -space-x-2">
                        {contact.participants.slice(0, 2).map((participant, index) => (
                          <img 
                            key={participant.id}
                            src={participant.profile_image ? formatImageUrl(participant.profile_image) : `https://i.pravatar.cc/150?u=user${participant.id}`}
                            alt={participant.full_name || participant.username}
                            className={`chat-avatar border-2 border-white ${contact.online ? 'online' : ''} cursor-pointer`}
                            style={{ zIndex: 2 - index, width: '2rem', height: '2rem' }}
                            onClick={(e) => handleProfileClick(participant.id, e)}
                          />
                        ))}
                        {(() => {
                          const activeContact = contacts.find(c => c.id === activeConversation);
                          return activeContact?.participants && activeContact.participants.length > 3 ? (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-700 font-medium border-2 border-white" style={{ zIndex: 0 }}>
                              +{activeContact.participants.length - 3}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    ) : (
                      <img 
                        src={contact.avatar} 
                        alt={contact.name} 
                        className={`chat-avatar ${contact.online ? 'online' : ''} cursor-pointer`}
                        onClick={(e) => handleProfileClick(contact.id, e)}
                      />
                    )}
                  </div>
                  
                  <div className="chat-user-info">
                    <div className="chat-username">{contact.name}</div>
                    <div className="chat-preview">{contact.lastMessage}</div>
                  </div>
                  
                  <div className="chat-meta">
                    <div className="chat-time">{contact.time}</div>
                    {contact.unread > 0 && (
                      <div className="chat-badge">{contact.unread}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-gray-500">No conversations found</div>
            )}
          </div>
        </div>
        
        {/* Chat Main Content */}
        <div className="chat-content">
          {/* Chat Header */}
          {activeConversationData && contacts.length > 0 && (
            <div className="chat-header">
              <div className="chat-user">
                {/* Show multiple avatars for group conversations */}
                {contacts.find(c => c.id === activeConversation)?.isGroup ? (
                  <div className="flex -space-x-2 mr-2">
                    {contacts.find(c => c.id === activeConversation)?.participants.slice(0, 3).map((participant, index) => (
                      <img 
                        key={participant.id}
                        src={participant.profile_image ? formatImageUrl(participant.profile_image) : `https://i.pravatar.cc/150?u=user${participant.id}`}
                        alt={participant.full_name || participant.username}
                        className="chat-avatar cursor-pointer border-2 border-white"
                        style={{ zIndex: 3 - index }}
                        onClick={(e) => handleProfileClick(participant.id, e)}
                      />
                    ))}
                    {(() => {
                      const activeContact = contacts.find(c => c.id === activeConversation);
                      return activeContact?.participants && activeContact.participants.length > 3 ? (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-700 font-medium border-2 border-white" style={{ zIndex: 0 }}>
                          +{activeContact.participants.length - 3}
                        </div>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <img 
                    src={contacts.find(c => c.id === activeConversation)?.avatar} 
                    alt={contacts.find(c => c.id === activeConversation)?.name}
                    className="chat-avatar cursor-pointer mr-2"
                    onClick={(e) => {
                      const contactId = contacts.find(c => c.id === activeConversation)?.id;
                      if (contactId) handleProfileClick(contactId, e);
                    }}
                  />
                )}
                <div>
                  <div className="font-medium">
                    {contacts.find(c => c.id === activeConversation)?.name}
                  </div>
                  {/* Show participant count for group conversations */}
                  {(() => {
                    const activeContact = contacts.find(c => c.id === activeConversation);
                    if (activeContact?.isGroup) {
                      return (
                        <div className="text-sm text-gray-500">
                          {activeContact.participants?.length || 0} participants
                        </div>
                      );
                    } else if (activeContact?.online) {
                      return <div className="chat-user-status">Online</div>;
                    } else {
                      return <div className="text-sm text-gray-500">Offline</div>;
                    }
                  })()}
                </div>
              </div>
              
              <div className="chat-actions">
                <button className="chat-action-button">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button className="chat-action-button">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Chat Messages */}
          <div className="chat-messages">
            {loadingMessages ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date} className="message-group">
                  <div className="text-center mb-4">
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                      {date}
                    </span>
                  </div>
                  
                  {dateMessages.map(message => {
                    // Force both IDs to be numbers and log them for debugging
                    const msgSenderId = Number(message.senderId);
                    const currentUserId = user?.id ? Number(user.id) : Number(userId);
                    const isCurrentUser = msgSenderId === currentUserId;
                    
                    // Skip rendering messages that have been deleted (only for this demo)
                    if (message.isDeleted) {
                      return (
                        <div key={message.id} className="flex w-full justify-center mb-4">
                          <div 
                            className="max-w-[70%] bg-gray-100 text-gray-500 rounded-xl p-2 text-xs italic flex items-center"
                            style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            This message was deleted
                          </div>
                        </div>
                      );
                    }
                    
                    if (isCurrentUser) {
                      // Current user's message (right side)
                      return (
                        <div 
                          key={message.id} 
                          className="flex w-full justify-end mb-4"
                          onContextMenu={(e) => handleMessageContextMenu(e, message)}
                        >
                          <div 
                            className={`flex flex-col ${selectedMessage === message.id ? 'opacity-70' : ''}`}
                            style={{ maxWidth: '70%' }}
                          >
                            {/* Reply indicator - Moved above message content */}
                            {message.replyToId && (
                              <div 
                                // Adjusted classes for layout and styling
                                className="flex items-center bg-blue-50 p-2 rounded-t-xl text-xs text-blue-800 border-l-4 border-blue-500"
                                // Removed mx-1 class to make the width match
                              >
                                {/* Removed the separate div for the line, using border-l instead */}
                                <div className="ml-1"> {/* Added margin-left */}
                                  <div className="font-semibold">{message.replyToSender || 'Reply to'}</div>
                                  <div className="truncate">{message.replyToContent}</div>
                                </div>
                              </div>
                            )}
                            
                            {/* Message content */}
                            <div 
                              // Adjusted border radius based on whether it's a reply
                              className={`relative ${message.replyToId ? 'rounded-b-xl rounded-tr-xl' : 'rounded-xl rounded-tr-none'}`}
                              style={{ 
                                backgroundColor: '#3b82f6', 
                                color: 'white', 
                                padding: '0.75rem', 
                                fontSize: '0.875rem'
                              }}
                            >
                              {message.content}
                              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'rgba(255, 255, 255, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <span>{message.time}</span>
                                <span className="ml-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${message.isRead ? 'text-white' : 'text-white/50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              </div>
                              {message.isLiked && (
                                <span className="absolute -left-2 -bottom-2 text-lg">❤️</span>
                              )}
                            </div>
                          </div>
                          
                          <img 
                            src={user?.profile_image ? formatImageUrl(user.profile_image) : (userProfileImage ? formatImageUrl(userProfileImage) : `https://i.pravatar.cc/150?u=me`)} 
                            alt="Me"
                            className="w-8 h-8 rounded-full ml-2 self-end cursor-pointer"
                            onClick={(e) => {
                              // Navigate to current user's profile
                              navigate('/profile');
                              e.stopPropagation();
                            }}
                          />
                        </div>
                      );
                    } else {
                      // Other user's message (left side)
                    return (
                      <div 
                        key={message.id}
                          className="flex w-full justify-start mb-4"
                          onContextMenu={(e) => handleMessageContextMenu(e, message)}
                      >
                          <img 
                            src={message.senderProfileImage ? formatImageUrl(message.senderProfileImage) : `https://i.pravatar.cc/150?u=user${message.senderId}`} 
                            alt={message.senderName}
                            className="w-8 h-8 rounded-full mr-2 self-end cursor-pointer"
                            onClick={(e) => handleProfileClick(message.senderId, e)}
                          />
                          
                          <div 
                            className={`flex flex-col ${selectedMessage === message.id ? 'opacity-70' : ''}`}
                            style={{ maxWidth: '70%' }}
                          >
                            {/* Reply indicator - Moved above message content */}
                            {message.replyToId && (
                              <div 
                                // Adjusted classes for layout and styling
                                className="flex items-center bg-gray-50 p-2 rounded-t-xl text-xs text-gray-800 border-l-4 border-gray-400" 
                                // Removed mx-1 class to make the width match
                              >
                                {/* Removed the separate div for the line, using border-l instead */}
                                <div className="ml-1"> {/* Added margin-left */}
                                  <div className="font-semibold">{message.replyToSender || 'Reply to'}</div>
                                  <div className="truncate">{message.replyToContent}</div>
                                </div>
                              </div>
                            )}
                            
                            {/* Message content */}
                            <div 
                              // Adjusted border radius based on whether it's a reply
                              className={`relative ${message.replyToId ? 'rounded-b-xl rounded-tl-xl' : 'rounded-xl rounded-tl-none'}`}
                              style={{ 
                                backgroundColor: 'white', 
                                color: '#333', 
                                padding: '0.75rem', 
                                fontSize: '0.875rem',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' 
                              }}
                            >
                          {message.content}
                              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#6b7280', display: 'flex', alignItems: 'center' }}>
                                <span>{message.time}</span>
                              </div>
                              {message.isLiked && (
                                <span className="absolute -right-2 -bottom-2 text-lg">❤️</span>
                              )}
                            </div>
                          </div>
                      </div>
                    );
                    }
                  })}
                </div>
              ))
            )}
            <div ref={messageEndRef} />
          </div>
          
          {/* Context Menu */}
          {showContextMenu && actionMenuPosition && (
            <div 
              className="fixed z-50 bg-white rounded-lg shadow-lg overflow-hidden"
              style={{ 
                top: actionMenuPosition.top, 
                left: actionMenuPosition.left,
                width: '180px'
              }}
            >
              <ul className="py-1">
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-sm" onClick={() => {
                  const message = messages.find(m => m.id === selectedMessage);
                  if (message) handleReplyMessage(message);
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Reply
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-sm" onClick={() => {
                  if (selectedMessage) handleLikeMessage(selectedMessage);
                }}>
                  {messages.find(m => m.id === selectedMessage)?.isLiked ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      Unlike
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Like
                    </>
                  )}
                </li>
                {/* Only show delete option for the user's own messages */}
                {messages.find(m => m.id === selectedMessage)?.senderId === userId && (
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-sm text-red-600" onClick={() => {
                  if (selectedMessage) handleDeleteMessage(selectedMessage);
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </li>
                )}
              </ul>
            </div>
          )}
          
          {/* Chat Input Form */}
          <div className="chat-footer">
            {/* Reply indicator */}
            {replyingTo && (
              <div className="flex items-center justify-between bg-gray-100 p-2 mb-2 rounded-lg text-sm">
                <div className="flex items-center">
                  <div className="w-1 h-10 bg-primary mr-2"></div>
                  <div>
                    <div className="font-semibold text-primary">{replyingTo.senderName}</div>
                    <div className="text-gray-500 truncate" style={{ maxWidth: '300px' }}>{replyingTo.content}</div>
                  </div>
                </div>
                <button 
                  onClick={handleCancelReply}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <form className="message-form" onSubmit={handleSendMessage}>
              {!isRecording ? (
                <>
              <button 
                type="button" 
                className="p-2 text-gray-500 rounded-full hover:bg-gray-100"
                    onClick={handleToggleEmojiPicker}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={replyingTo ? `Reply to ${replyingTo.senderName}...` : "Type a message..."}
                className="message-input"
                disabled={!activeConversation}
              />
              
                  <button 
                    type="button" 
                    className="p-2 text-gray-500 rounded-full hover:bg-gray-100 mr-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  
                  {messageInput.trim() ? (
              <button 
                type="submit" 
                className="message-send-button"
                disabled={!messageInput.trim() || !activeConversation}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
                  ) : (
                    <button 
                      type="button"
                      className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
                      onMouseDown={startRecording}
                      disabled={!activeConversation}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-between bg-gray-50 rounded-full px-4 py-2">
                  <div className="flex items-center">
                    <div className="animate-pulse text-red-500 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-text-dark">Recording {formatTime(recordingTime)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      className="p-2 text-red-500 rounded-full hover:bg-red-50"
                      onClick={cancelRecording}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button 
                      type="button"
                      className="p-2 text-green-500 rounded-full hover:bg-green-50"
                      onClick={stopRecording}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </form>
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-14 left-2 z-10">
                {/* This is just a placeholder. In a real app, you would use an emoji picker component */}
                <div className="bg-white rounded-lg shadow-lg p-2 grid grid-cols-8 gap-1 max-h-60 overflow-y-auto">
                  {['😀', '😁', '😂', '😃', '😄', '😅', '😆', '😇', '😈', '😉', '😊', '😋', '😌', '😍', '😎', '😏',
                    '😐', '😑', '😒', '😓', '😔', '😕', '😖', '😗', '😘', '😙', '😚', '😛', '😜', '😝', '😞', '😟',
                    '❤️', '💔', '💯', '✅', '👍', '👎', '👏', '🙏', '👋'].map(emoji => (
                    <button
                      key={emoji}
                      className="text-2xl hover:bg-gray-100 p-1 rounded"
                      onClick={() => handleEmojiSelect({ native: emoji })}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="text-lg font-medium">New Message</h3>
              <button 
                onClick={() => {
                  setShowNewMessageModal(false);
                  setSelectedUsers([]);
                  setUserSearchQuery('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To:
                </label>
                <div className="selected-users">
                  {selectedUsers.map(user => (
                    <div key={user.id} className="selected-user-tag">
                      <img 
                        src={user.profile_image || `https://i.pravatar.cc/150?u=user${user.id}`} 
                        alt={user.full_name || user.username}
                        className="w-4 h-4 rounded-full mr-1"
                      />
                      <span>{user.full_name || user.username}</span>
                      <button 
                        onClick={() => handleRemoveUser(user.id)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <input 
                  type="text" 
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search for users..." 
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="mt-2 max-h-60 overflow-y-auto">
                {isLoadingUsers ? (
                  <div className="loading-spinner">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <div 
                      key={user.id} 
                      className="user-option"
                      onClick={() => handleSelectUser(user)}
                    >
                      <img 
                        src={user.profile_image || `https://i.pravatar.cc/150?u=user${user.id}`} 
                        alt={user.full_name || user.username}
                        className="user-avatar"
                      />
                      <div>
                        <div className="font-medium">{user.full_name || user.username}</div>
                        {user.full_name && <div className="text-sm text-gray-500">@{user.username}</div>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-2 text-gray-500">
                    {userSearchQuery ? 'No users found' : 'Start typing to search for users'}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={handleCreateConversation}
                disabled={selectedUsers.length === 0}
                className={`px-4 py-2 rounded-md ${
                  selectedUsers.length === 0 
                    ? 'bg-blue-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors`}
              >
                Start Conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage; 