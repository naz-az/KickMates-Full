import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import {
  getDiscussionById,
  addDiscussionComment,
  voteDiscussion,
  voteComment,
  deleteDiscussion,
  deleteComment,
} from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

interface RouteParams {
  discussionId: number;
}

interface DiscussionComment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  discussion_id: number;
  username: string;
  profile_image?: string;
  votes_up: number;
  votes_down: number;
  is_upvoted?: boolean;
  is_downvoted?: boolean;
}

interface Discussion {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
  creator_id: number;
  username: string;
  profile_image?: string;
  votes_up: number;
  votes_down: number;
  image_url?: string;
  comments?: DiscussionComment[];
  is_upvoted?: boolean;
  is_downvoted?: boolean;
}

const DiscussionDetailScreen = () => {
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { discussionId } = route.params;
  const { user } = useContext(AuthContext);
  
  useEffect(() => {
    fetchDiscussion();
  }, [discussionId]);
  
  const fetchDiscussion = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getDiscussionById(discussionId);
      setDiscussion(response.data.discussion);
      setComments(response.data.discussion.comments || []);
    } catch (err) {
      console.error('Error fetching discussion:', err);
      setError('Failed to load discussion. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDiscussion();
    setRefreshing(false);
  };
  
  const handleSubmitComment = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    
    if (!newComment.trim()) {
      Alert.alert('Error', 'Comment cannot be empty');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await addDiscussionComment(discussionId.toString(), newComment);
      
      setComments([...comments, response.data.comment]);
      setNewComment('');
    } catch (err) {
      console.error('Error submitting comment:', err);
      Alert.alert('Error', 'Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleVoteDiscussion = async (type: 'up' | 'down') => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    
    if (!discussion) return;
    
    try {
      const response = await voteDiscussion(discussion.id, type);
      
      if (response.data.success) {
        setDiscussion({
          ...discussion,
          votes_up: response.data.votes_up,
          votes_down: response.data.votes_down,
          is_upvoted: response.data.is_upvoted,
          is_downvoted: response.data.is_downvoted,
        });
      }
    } catch (err) {
      console.error('Error voting on discussion:', err);
      Alert.alert('Error', 'Failed to vote. Please try again.');
    }
  };
  
  const handleVoteComment = async (commentId: number, type: 'up' | 'down') => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    
    try {
      const response = await voteComment(commentId, type);
      
      if (response.data.success) {
        setComments(
          comments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  votes_up: response.data.votes_up,
                  votes_down: response.data.votes_down,
                  is_upvoted: response.data.is_upvoted,
                  is_downvoted: response.data.is_downvoted,
                }
              : comment
          )
        );
      }
    } catch (err) {
      console.error('Error voting on comment:', err);
      Alert.alert('Error', 'Failed to vote. Please try again.');
    }
  };
  
  const handleDeleteDiscussion = async () => {
    Alert.alert(
      'Delete Discussion',
      'Are you sure you want to delete this discussion? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDiscussion(discussion?.id || 0);
              navigation.goBack();
            } catch (err) {
              console.error('Error deleting discussion:', err);
              Alert.alert('Error', 'Failed to delete discussion. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  const handleDeleteComment = async (commentId: number) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(commentId);
              setComments(comments.filter((comment) => comment.id !== commentId));
            } catch (err) {
              console.error('Error deleting comment:', err);
              Alert.alert('Error', 'Failed to delete comment. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (err) {
      return dateString;
    }
  };
  
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={fetchDiscussion}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }
  
  if (!discussion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Discussion not found</Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Discussion Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            
            <View style={styles.userInfo}>
              <Image 
                source={discussion.profile_image ? { uri: discussion.profile_image } : require('../assets/images/default-avatar.png')} 
                style={styles.userAvatar} 
              />
              <View>
                <Text style={styles.username}>{discussion.username}</Text>
                <Text style={styles.postedDate}>{formatDate(discussion.created_at)}</Text>
              </View>
            </View>
            
            {user && user.id === discussion.creator_id && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('EditDiscussion', { discussionId: discussion.id })}
                >
                  <Ionicons name="create-outline" size={20} color="#4F46E5" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleDeleteDiscussion}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Discussion Content */}
          <View style={styles.discussionContent}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{discussion.category}</Text>
            </View>
            
            <Text style={styles.discussionTitle}>{discussion.title}</Text>
            <Text style={styles.discussionBody}>{discussion.content}</Text>
            
            {discussion.image_url && (
              <Image 
                source={{ uri: discussion.image_url }} 
                style={styles.discussionImage} 
                resizeMode="cover"
              />
            )}
            
            <View style={styles.discussionFooter}>
              <View style={styles.votes}>
                <TouchableOpacity 
                  style={[styles.voteButton, discussion.is_upvoted && styles.voteButtonActive]}
                  onPress={() => handleVoteDiscussion('up')}
                >
                  <Ionicons 
                    name={discussion.is_upvoted ? "arrow-up" : "arrow-up-outline"} 
                    size={20} 
                    color={discussion.is_upvoted ? "#FFFFFF" : "#4F46E5"} 
                  />
                  <Text 
                    style={[styles.voteCount, discussion.is_upvoted && styles.voteCountActive]}
                  >
                    {discussion.votes_up}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.voteButton, discussion.is_downvoted && styles.voteButtonActiveDown]}
                  onPress={() => handleVoteDiscussion('down')}
                >
                  <Ionicons 
                    name={discussion.is_downvoted ? "arrow-down" : "arrow-down-outline"} 
                    size={20} 
                    color={discussion.is_downvoted ? "#FFFFFF" : "#EF4444"} 
                  />
                  <Text 
                    style={[styles.voteCount, discussion.is_downvoted && styles.voteCountActive]}
                  >
                    {discussion.votes_down}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.commentCount}>
                <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
                <Text style={styles.commentCountText}>{comments.length} comments</Text>
              </View>
            </View>
          </View>
          
          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientContainer}
            >
              <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
            </LinearGradient>
            
            {/* Add Comment */}
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
                placeholderTextColor="#9CA3AF"
              />
              <Button
                title="Post"
                onPress={handleSubmitComment}
                disabled={isSubmitting || !newComment.trim()}
                icon={<Ionicons name="send" size={18} color="#FFFFFF" />}
                style={styles.postButton}
              />
            </View>
            
            {/* Comments List */}
            {comments.length > 0 ? (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentUserInfo}>
                      <Image 
                        source={comment.profile_image ? { uri: comment.profile_image } : require('../assets/images/default-avatar.png')} 
                        style={styles.commentUserAvatar} 
                      />
                      <View>
                        <Text style={styles.commentUsername}>{comment.username}</Text>
                        <Text style={styles.commentDate}>{formatDate(comment.created_at)}</Text>
                      </View>
                    </View>
                    
                    {user && user.id === comment.user_id && (
                      <TouchableOpacity 
                        style={styles.commentDeleteButton}
                        onPress={() => handleDeleteComment(comment.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <Text style={styles.commentContent}>{comment.content}</Text>
                  
                  <View style={styles.commentFooter}>
                    <TouchableOpacity 
                      style={[styles.commentVoteButton, comment.is_upvoted && styles.commentVoteButtonActive]}
                      onPress={() => handleVoteComment(comment.id, 'up')}
                    >
                      <Ionicons 
                        name={comment.is_upvoted ? "arrow-up" : "arrow-up-outline"} 
                        size={16} 
                        color={comment.is_upvoted ? "#FFFFFF" : "#4F46E5"} 
                      />
                      <Text 
                        style={[styles.commentVoteCount, comment.is_upvoted && styles.commentVoteCountActive]}
                      >
                        {comment.votes_up}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.commentVoteButton, comment.is_downvoted && styles.commentVoteButtonActiveDown]}
                      onPress={() => handleVoteComment(comment.id, 'down')}
                    >
                      <Ionicons 
                        name={comment.is_downvoted ? "arrow-down" : "arrow-down-outline"} 
                        size={16} 
                        color={comment.is_downvoted ? "#FFFFFF" : "#EF4444"} 
                      />
                      <Text 
                        style={[styles.commentVoteCount, comment.is_downvoted && styles.commentVoteCountActive]}
                      >
                        {comment.votes_down}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noCommentsContainer}>
                <Ionicons name="chatbubbles-outline" size={32} color="#9CA3AF" />
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSubtext}>Be the first to add a comment</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  postedDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  discussionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#EEF2FF',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#4F46E5',
  },
  discussionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  discussionBody: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 16,
    lineHeight: 24,
  },
  discussionImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  discussionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  votes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  voteButtonActive: {
    backgroundColor: '#4F46E5',
  },
  voteButtonActiveDown: {
    backgroundColor: '#EF4444',
  },
  voteCount: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 4,
  },
  voteCountActive: {
    color: '#FFFFFF',
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCountText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  commentsSection: {
    marginBottom: 16,
  },
  gradientContainer: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addCommentContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  commentInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#111827',
    minHeight: 80,
    marginBottom: 12,
  },
  postButton: {
    alignSelf: 'flex-end',
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  commentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  commentDeleteButton: {
    padding: 6,
  },
  commentContent: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentVoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  commentVoteButtonActive: {
    backgroundColor: '#4F46E5',
  },
  commentVoteButtonActiveDown: {
    backgroundColor: '#EF4444',
  },
  commentVoteCount: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 4,
  },
  commentVoteCountActive: {
    color: '#FFFFFF',
  },
  noCommentsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});

export default DiscussionDetailScreen; 