import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { AuthContext } from '../context/AuthContext';
import {
  getMessages,
  sendMessage,
  deleteMessage,
  likeMessage,
  unlikeMessage,
  // markConversationAsRead, // Commented out as endpoint doesn't exist
} from '../services/api';
import { navigateToUserProfile } from '../utils/navigation';

interface RouteParams {
  conversationId: number;
  recipientId: number;
  recipientName: string;
  recipientImage?: string;
  eventId?: number;
  eventTitle?: string;
}

interface Message {
  id: number;
  sender_id: number;
  sender_username: string;
  sender_name: string;
  sender_profile_image: string;
  content: string;
  is_read: boolean;
  created_at: string;
  reply_to_id: number | null;
  reply_to_content: string | null;
  reply_to_sender: string | null;
  likes: number;
  is_liked: number;
}

const ConversationScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [likedMessages, setLikedMessages] = useState<Set<number>>(new Set());
  
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();
  const { user: currentUser } = useContext(AuthContext);
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { conversationId, recipientId, recipientName, recipientImage, eventId, eventTitle } = route.params;
  
  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!conversationId) {
      setError('Invalid conversation ID');
      setIsLoading(false);
      return;
    }
    
    fetchMessages();
    
    // Mark conversation as read when opened
    // markConversationAsRead(conversationId).catch((err) => {
    //   console.error('Error marking conversation as read:', err);
    // });
    
    const intervalId = setInterval(() => {
      fetchMessages(false);
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [conversationId]);
  
  const fetchMessages = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      
      const response = await getMessages(conversationId);
      console.log('Messages response:', response); // Debug log
      
      if (Array.isArray(response.data)) {
        setMessages(response.data);
      } else {
        console.error('Invalid messages response:', response.data);
        setError('Invalid response format from server');
      }
      
      // Scroll to the bottom after messages are loaded
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };
  
  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setNewMessage('');
  };

  const handleDelete = async (message: Message) => {
    try {
      const response = await deleteMessage(conversationId, message.id);
      if (response.status === 200) {
        setMessages(messages.filter(m => m.id !== message.id));
        setShowMessageActions(false);
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to delete message');
      }
    } catch (error: any) {
      console.error('Error deleting message:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'You are not authorized to delete this message'
      );
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageToSend = newMessage;
    setNewMessage('');
    setReplyingTo(null);

    try {
      const response = await sendMessage(conversationId, messageToSend, replyingTo?.id);
      console.log('Send message response:', response); // Debug log
      
      if (response.data) {
        setMessages([...messages, response.data]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.error('Invalid send message response:', response);
        Alert.alert('Error', 'Invalid response from server');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageToSend);
      Alert.alert('Error', 'Failed to send message');
    }
  };
  
  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // If today, return time only
      if (date.toDateString() === now.toDateString()) {
        return format(date, 'h:mm a');
      }
      
      return format(date, 'MMM d, h:mm a');
    } catch (err) {
      return dateString;
    }
  };
  
  const handleLike = async (messageId: number) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      if (message.is_liked) {
        await unlikeMessage(conversationId.toString(), messageId.toString());
      } else {
        await likeMessage(conversationId.toString(), messageId.toString());
      }

      // Refresh messages to get updated like count
      await fetchMessages();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === currentUser?.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage
        ]}
        onLongPress={() => {
          setSelectedMessage(item);
          setShowMessageActions(true);
        }}
        delayLongPress={300}
      >
        {!isOwnMessage && (
          <Image
            source={{ uri: item.sender_profile_image || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
        )}
        <View style={[
          styles.messageContent,
          isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent
        ]}>
          {!isOwnMessage && (
            <Text style={styles.senderName}>{item.sender_name || item.sender_username}</Text>
          )}
          {item.reply_to_content && (
            <View style={[
              styles.replyContainer,
              isOwnMessage ? { borderLeftColor: '#FFFFFF' } : {}
            ]}>
              <Text style={[
                styles.replyToText,
                isOwnMessage ? { color: '#FFFFFF' } : {}
              ]}>
                Replying to {item.reply_to_sender}
              </Text>
              <Text style={[
                styles.replyContent,
                isOwnMessage ? { color: '#FFFFFF' } : {}
              ]}>
                {item.reply_to_content}
              </Text>
            </View>
          )}
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>{item.content}</Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {formatMessageTime(item.created_at)}
            </Text>
            <TouchableOpacity 
              style={styles.likeButton}
              onPress={() => handleLike(item.id)}
            >
              <Ionicons
                name={item.is_liked ? 'heart' : 'heart-outline'}
                size={16}
                color={item.is_liked ? '#FF3B30' : '#8E8E93'}
              />
              {item.likes > 0 && (
                <Text style={styles.likeCount}>{item.likes}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const handleUserProfilePress = (recipientId: number) => {
    navigateToUserProfile(navigation, recipientId, currentUser?.id);
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity 
            style={styles.navbarButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.navbarTitleContainer}>
            <Text style={styles.navbarTitle}>{recipientName}</Text>
            {eventTitle && (
              <Text style={styles.navbarSubtitle}>{eventTitle}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.navbarButton}
            onPress={() => handleUserProfilePress(recipientId)}
          >
            <Ionicons name="person-circle-outline" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Messages List */}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity 
          style={styles.navbarButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.navbarTitleContainer}>
          <Text style={styles.navbarTitle}>{recipientName}</Text>
          {eventTitle && (
            <Text style={styles.navbarSubtitle}>{eventTitle}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.navbarButton}
          onPress={() => handleUserProfilePress(recipientId)}
        >
          <Ionicons name="person-circle-outline" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Messages List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => fetchMessages()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            onLayout={() => flatListRef.current?.scrollToEnd()}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Reply Preview */}
        {replyingTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyPreviewContent}>
              <Text style={styles.replyPreviewText}>
                Replying to {replyingTo.sender_name}
              </Text>
              <Text style={styles.replyPreviewMessage} numberOfLines={1}>
                {replyingTo.content}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.replyPreviewClose}
              onPress={() => setReplyingTo(null)}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Ionicons name="send" size={24} color={newMessage.trim() ? '#4F46E5' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Message Actions Modal */}
      <Modal
        visible={showMessageActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMessageActions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMessageActions(false)}
        >
          <View style={styles.messageActions}>
            {selectedMessage && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setReplyingTo(selectedMessage);
                    setShowMessageActions(false);
                  }}
                >
                  <Ionicons name="arrow-undo" size={24} color="#4F46E5" />
                  <Text style={styles.actionText}>Reply</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    handleLike(selectedMessage.id);
                    setShowMessageActions(false);
                  }}
                >
                  <Ionicons
                    name={selectedMessage.is_liked ? "heart" : "heart-outline"}
                    size={24}
                    color={selectedMessage.is_liked ? "#EF4444" : "#4F46E5"}
                  />
                  <Text style={styles.actionText}>
                    {selectedMessage.is_liked ? "Unlike" : "Like"}
                  </Text>
                </TouchableOpacity>
                {selectedMessage.sender_id === currentUser?.id && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => {
                      handleDelete(selectedMessage);
                      setShowMessageActions(false);
                    }}
                  >
                    <Ionicons name="trash-outline" size={24} color="#EF4444" />
                    <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  eventTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  eventTitle: {
    fontSize: 12,
    color: '#4F46E5',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 8,
  },
  retryButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  messagesList: {
    flexGrow: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageContent: {
    borderRadius: 16,
    padding: 12,
  },
  ownMessageContent: {
    backgroundColor: '#4F46E5',
    borderTopRightRadius: 4,
  },
  otherMessageContent: {
    backgroundColor: '#E5E7EB',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  ownMessageTime: {
    color: '#9CA3AF',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 48,
    fontSize: 16,
    color: '#111827',
    maxHeight: 100,
  },
  sendButton: {
    position: 'absolute',
    right: 24,
    bottom: 16,
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  senderName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  replyContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
  },
  replyToText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
    marginBottom: 4,
  },
  replyContent: {
    fontSize: 14,
    color: '#374151',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  likeCount: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navbarButton: {
    padding: 8,
  },
  navbarTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  navbarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  navbarSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  replyPreviewContent: {
    flex: 1,
    marginRight: 8,
  },
  replyPreviewText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  replyPreviewMessage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  replyPreviewClose: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageActions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 300,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 16,
    color: '#4F46E5',
    marginLeft: 12,
  },
  deleteButton: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  deleteText: {
    color: '#EF4444',
  },
});

export default ConversationScreen; 