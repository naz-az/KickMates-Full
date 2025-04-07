import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { voteComment, deleteComment, voteDiscussionComment, deleteDiscussionComment } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Button from './Button';
import Input from './Input';
import { useNavigation } from '@react-navigation/native';
import { navigateToUserProfile } from '../utils/navigation';

interface User {
  id: number;
  username: string;
  profile_image?: string;
}

interface CommentProps {
  id: number;
  parentId?: number | null;
  content: string;
  createdAt: string;
  user: User;
  upvotes: number;
  downvotes: number;
  userVote: 'up' | 'down' | null;
  targetId: string; // event or discussion ID
  targetType: 'event' | 'discussion';
  replies?: CommentType[];
  onReply?: (commentId: number) => void;
  onDelete?: (commentId: number) => void;
  onAddReply?: (parentId: number, content: string) => Promise<void>;
}

export type CommentType = Omit<CommentProps, 'onReply' | 'onDelete' | 'onAddReply'>;

const Comment: React.FC<CommentProps> = ({ 
  id, 
  parentId, 
  content, 
  createdAt, 
  user, 
  upvotes, 
  downvotes, 
  userVote, 
  targetId, 
  targetType,
  replies = [],
  onReply,
  onDelete,
  onAddReply,
}) => {
  const { user: currentUser } = React.useContext(AuthContext);
  const navigation = useNavigation();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(replies.length < 3);
  const [currentUserVote, setCurrentUserVote] = useState(userVote);
  const [currentUpvotes, setCurrentUpvotes] = useState(upvotes);
  const [currentDownvotes, setCurrentDownvotes] = useState(downvotes);
  const [loading, setLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isOwnComment = currentUser?.id === user?.id;
  const hasReplies = replies && replies.length > 0;

  const handleProfilePress = () => {
    navigateToUserProfile(navigation, user.id, currentUser?.id);
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    setLoading(true);
    try {
      const voteApi = targetType === 'event' ? voteComment : voteDiscussionComment;
      await voteApi(targetId, id.toString(), voteType);
      
      // Update UI optimistically
      if (currentUserVote === voteType) {
        // Cancel vote
        setCurrentUserVote(null);
        if (voteType === 'up') {
          setCurrentUpvotes(prev => prev - 1);
        } else {
          setCurrentDownvotes(prev => prev - 1);
        }
      } else if (currentUserVote === null) {
        // New vote
        setCurrentUserVote(voteType);
        if (voteType === 'up') {
          setCurrentUpvotes(prev => prev + 1);
        } else {
          setCurrentDownvotes(prev => prev + 1);
        }
      } else {
        // Change vote
        setCurrentUserVote(voteType);
        if (voteType === 'up') {
          setCurrentUpvotes(prev => prev + 1);
          setCurrentDownvotes(prev => prev - 1);
        } else {
          setCurrentUpvotes(prev => prev - 1);
          setCurrentDownvotes(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error voting on comment:', error);
      Alert.alert('Error', 'Failed to vote on comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    console.log(`[COMMENT DEBUG] Delete button clicked for comment ID: ${id}, user: ${user.username}`);
    console.log(`[COMMENT DEBUG] Has onDelete callback: ${!!onDelete}, targetId: ${targetId}, targetType: ${targetType}`);
    
    // Check if running on web
    const isWeb = Platform.OS === 'web';
    
    if (isWeb) {
      // Show custom web modal instead of default browser alert
      setShowDeleteModal(true);
    } else {
      // Use a setTimeout to ensure the Alert is displayed properly on mobile
      setTimeout(() => {
        Alert.alert(
          `Delete Comment #${id}`,
          `Are you sure you want to delete this comment?\n\nComment ID: ${id}\nUser: ${user.username}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'YES, DELETE IT', 
              style: 'destructive', 
              onPress: async () => {
                console.log(`[COMMENT DEBUG] Delete confirmed for comment ID: ${id}`);
                setLoading(true);
                try {
                  if (onDelete) {
                    console.log(`[COMMENT DEBUG] Calling onDelete callback with ID: ${id}`);
                    await onDelete(id);
                    console.log(`[COMMENT DEBUG] onDelete callback completed successfully`);
                  } else {
                    console.error(`[COMMENT DEBUG] No onDelete callback provided!`);
                  }
                } catch (error) {
                  console.error(`[COMMENT DEBUG] Error in handleDelete:`, error);
                  Alert.alert('Error', 'Failed to delete comment. Please try again.');
                } finally {
                  setLoading(false);
                }
              } 
            },
          ]
        );
      }, 300);
    }
  };

  const confirmDelete = async () => {
    console.log(`[COMMENT DEBUG] Delete confirmed for comment ID: ${id}`);
    setLoading(true);
    try {
      if (onDelete) {
        console.log(`[COMMENT DEBUG] Calling onDelete callback with ID: ${id}`);
        await onDelete(id);
        console.log(`[COMMENT DEBUG] onDelete callback completed successfully`);
      } else {
        console.error(`[COMMENT DEBUG] No onDelete callback provided!`);
      }
    } catch (error) {
      console.error(`[COMMENT DEBUG] Error in handleDelete:`, error);
      // Use a more elegant approach than alert for web
      console.error('Failed to delete comment. Please try again.');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply(id);
    } else {
      setIsReplying(true);
    }
  };

  const submitReply = async () => {
    if (!replyContent.trim()) return;

    setReplyLoading(true);
    try {
      if (onAddReply) {
        await onAddReply(id, replyContent);
        setReplyContent('');
        setIsReplying(false);
        setShowReplies(true);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      Alert.alert('Error', 'Failed to add reply. Please try again.');
    } finally {
      setReplyLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <View style={[styles.container, parentId ? styles.replyContainer : null]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.userInfo} onPress={handleProfilePress}>
          {user.profile_image ? (
            <Image source={{ uri: user.profile_image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user.username[0].toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.timestamp}>{formatDate(createdAt)}</Text>
          </View>
        </TouchableOpacity>

        {isOwnComment && (
          <TouchableOpacity onPress={handleDelete} disabled={loading}>
            <View style={styles.deleteButtonContainer}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              {loading && <ActivityIndicator size="small" color="#EF4444" style={styles.deleteLoader} />}
            </View>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.content}>{content}</Text>

      <View style={styles.actionsContainer}>
        <View style={styles.votesContainer}>
          <TouchableOpacity 
            style={[styles.voteButton, currentUserVote === 'up' && styles.activeUpvote]} 
            onPress={() => handleVote('up')}
            disabled={loading}
          >
            <Ionicons 
              name={currentUserVote === 'up' ? 'arrow-up' : 'arrow-up-outline'} 
              size={16} 
              color={currentUserVote === 'up' ? '#10B981' : '#6B7280'} 
            />
            <Text style={[
              styles.voteCount, 
              currentUserVote === 'up' && styles.activeUpvoteText
            ]}>
              {currentUpvotes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.voteButton, currentUserVote === 'down' && styles.activeDownvote]} 
            onPress={() => handleVote('down')}
            disabled={loading}
          >
            <Ionicons 
              name={currentUserVote === 'down' ? 'arrow-down' : 'arrow-down-outline'} 
              size={16} 
              color={currentUserVote === 'down' ? '#EF4444' : '#6B7280'} 
            />
            <Text style={[
              styles.voteCount, 
              currentUserVote === 'down' && styles.activeDownvoteText
            ]}>
              {currentDownvotes}
            </Text>
          </TouchableOpacity>
        </View>

        {!parentId && (
          <TouchableOpacity 
            style={styles.replyButton} 
            onPress={handleReply}
            disabled={loading}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
            <Text style={styles.replyText}>Reply</Text>
          </TouchableOpacity>
        )}

        {loading && <ActivityIndicator size="small" color="#4F46E5" style={styles.loader} />}
      </View>

      {isReplying && (
        <View style={styles.replyInputContainer}>
          <Input
            placeholder="Write a reply..."
            value={replyContent}
            onChangeText={setReplyContent}
            multiline
            autoCapitalize="sentences"
          />
          <View style={styles.replyActions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => {
                setIsReplying(false);
                setReplyContent('');
              }}
              style={styles.cancelButton}
            />
            <Button
              title="Reply"
              onPress={submitReply}
              loading={replyLoading}
              disabled={replyContent.trim() === ''}
            />
          </View>
        </View>
      )}

      {hasReplies && (
        <TouchableOpacity 
          style={styles.showRepliesButton}
          onPress={() => setShowReplies(!showReplies)}
        >
          <Ionicons 
            name={showReplies ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#4F46E5" 
          />
          <Text style={styles.showRepliesText}>
            {showReplies ? "Hide" : "Show"} {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </Text>
        </TouchableOpacity>
      )}

      {hasReplies && showReplies && (
        <View style={styles.repliesContainer}>
          {replies.map(reply => (
            <Comment
              key={reply.id}
              id={reply.id}
              parentId={reply.parentId}
              content={reply.content}
              createdAt={reply.createdAt}
              user={reply.user}
              upvotes={reply.upvotes}
              downvotes={reply.downvotes}
              userVote={reply.userVote}
              targetId={targetId}
              targetType={targetType}
              onDelete={onDelete}
              onAddReply={onAddReply}
              replies={reply.replies || []}
            />
          ))}
        </View>
      )}

      {/* Custom Web Delete Modal */}
      {Platform.OS === 'web' && (
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="trash-outline" size={28} color="#EF4444" />
                <Text style={styles.modalTitle}>Delete Comment</Text>
              </View>
              
              <Text style={styles.modalMessage}>
                Are you sure you want to delete this comment?
              </Text>
              
              <Text style={styles.modalDetail}>
                Comment ID: {id}
              </Text>
              <Text style={styles.modalDetail}>
                User: {user.username}
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelButton} 
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteButton} 
                  onPress={confirmDelete}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.deleteButtonText}>DELETE</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  replyContainer: {
    marginLeft: 0,
    marginTop: 8,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
    borderRadius: 6,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  content: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  votesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  activeUpvote: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  activeDownvote: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  voteCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 2,
  },
  activeUpvoteText: {
    color: '#10B981',
  },
  activeDownvoteText: {
    color: '#EF4444',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  replyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
  },
  loader: {
    marginLeft: 8,
  },
  replyInputContainer: {
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: 8,
  },
  showRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 4,
  },
  showRepliesText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5',
    marginLeft: 4,
  },
  repliesContainer: {
    marginTop: 8,
  },
  deleteButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteLoader: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 16,
  },
  modalDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  modalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default Comment; 