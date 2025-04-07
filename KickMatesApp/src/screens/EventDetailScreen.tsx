import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Share,
  RefreshControl,
  Linking,
  TextInput,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { 
  getEventById, 
  joinEvent, 
  leaveEvent, 
  bookmarkEvent, 
  addComment, 
  getUserById,
  debugApiToken,
  deleteComment
} from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { EventsStackParamList, ProfileStackParamList } from '../navigation/AppNavigator';
import Button from '../components/Button';
import Comment, { CommentType } from '../components/Comment';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import theme from '../theme/theme';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Card from '../components/Card';
import { getSportGradient } from '../theme/theme';
import { navigateToUserProfile as navigateToProfile } from '../utils/navigation';
import { useToast } from '../context/ToastContext';

type EventDetailScreenRouteProp = RouteProp<EventsStackParamList, 'EventDetail'>;
type EventDetailScreenNavigationProp = NativeStackNavigationProp<EventsStackParamList, 'EditEvent'>;

interface APIComment {
  id: number;
  parent_comment_id: number | null;
  content: string;
  created_at: string;
  user_id: number;
  username: string;
  profile_image: string | null;
  thumbs_up?: number;
  thumbs_down?: number;
  user_vote?: 'up' | 'down' | null;
}

const EventDetailScreen = () => {
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [showAllDescription, setShowAllDescription] = useState(false);
  const [creator, setCreator] = useState<any>(null);
  const [participationStatus, setParticipationStatus] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  const route = useRoute<EventDetailScreenRouteProp>();
  const navigation = useNavigation<EventDetailScreenNavigationProp>();
  const profileNavigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  
  const { id } = route.params;
  const isBookmarkingRef = useRef(false);
  
  useEffect(() => {
    fetchEventDetails();
  }, [id]);
  
  useEffect(() => {
    if (event) {
      if (event.participationStatus) {
        setParticipationStatus(event.participationStatus);
        console.log('Participation status from API:', event.participationStatus);
      } else {
        const joined = calculateUserJoined();
        setParticipationStatus(joined ? 'confirmed' : null);
        console.log('Participation status from calculation:', joined ? 'confirmed' : null);
      }
      
      // Animate content in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [event, user]);
  
  const fetchEventDetails = async () => {
    setIsLoading(true);
    try {
      const response = await getEventById(id);
      console.log('FULL Event Data:', JSON.stringify(response.data, null, 2));
      
      // Check for all possible bookmark status indicators in the response
      const bookmarkStatus = response.data.isBookmarked === true || 
                           response.data.event?.bookmarked_by_user === true ||
                           response.data.event?.is_bookmarked === true;
      
      console.log('[DEBUG] BOOKMARK STATUS FROM API:', bookmarkStatus, {
        responseIsBookmarked: response.data.isBookmarked,
        eventBookmarkedByUser: response.data.event?.bookmarked_by_user,
        eventIsBookmarked: response.data.event?.is_bookmarked
      });
      
      const eventData = {
        ...response.data.event,
        participants: response.data.participants || [],
        participationStatus: response.data.participationStatus,
        bookmarked_by_user: bookmarkStatus
      };
      
      // Update the bookmark state from api response
      setIsBookmarked(bookmarkStatus);
      
      console.log('Event details fetched:', {
        id: eventData.id,
        participationStatus: eventData.participationStatus,
        participants: eventData.participants.length,
        bookmarked: eventData.bookmarked_by_user
      });
      
      setEvent(eventData);
      setParticipationStatus(response.data.participationStatus);
      
      const transformedComments = (response.data.comments || []).map((comment: APIComment) => ({
        id: comment.id,
        parentId: comment.parent_comment_id,
        content: comment.content,
        createdAt: comment.created_at,
        user: {
          id: comment.user_id,
          username: comment.username,
          profile_image: comment.profile_image
        },
        upvotes: comment.thumbs_up || 0,
        downvotes: comment.thumbs_down || 0,
        userVote: comment.user_vote,
        replies: []
      }));
      
      const commentMap = new Map<number, CommentType>();
      const topLevelComments: CommentType[] = [];
      
      transformedComments.forEach((comment: CommentType) => {
        commentMap.set(comment.id, comment);
      });
      
      transformedComments.forEach((comment: CommentType) => {
        if (comment.parentId) {
          const parentComment = commentMap.get(comment.parentId);
          if (parentComment) {
            parentComment.replies = parentComment.replies || [];
            parentComment.replies.push(comment);
          }
        } else {
          topLevelComments.push(comment);
        }
      });
      
      setComments(topLevelComments);
      
      if (eventData.creator_id) {
        const creatorResponse = await getUserById(eventData.creator_id);
        setCreator(creatorResponse.data.user);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      Alert.alert('Error', 'Failed to load event details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEventDetails();
    setRefreshing(false);
  };
  
  const handleJoinEvent = async () => {
    setIsJoining(true);
    try {
      await joinEvent(id);
      fetchEventDetails();
      Alert.alert('Success', 'You have joined this event!');
    } catch (error) {
      console.error('Error joining event:', error);
      Alert.alert('Error', 'Failed to join event. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleLeaveEvent = async () => {
    try {
      await leaveEvent(id);
      fetchEventDetails();
      Alert.alert('Success', 'You have left this event.');
    } catch (error) {
      console.error('Error leaving event:', error);
      Alert.alert('Error', 'Failed to leave event. Please try again.');
    }
  };
  
  const handleShareEvent = async () => {
    try {
      const message = `Check out this event on KickMates: ${event.title}`;
      await Share.share({
        message,
        title: event.title,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };
  
  const handleBookmarkEvent = async () => {
    // Prevent multiple rapid clicks
    if (isBookmarkingRef.current) {
      console.log('[EventDetail] Bookmark operation already in progress, ignoring click');
      return;
    }
    
    try {
      isBookmarkingRef.current = true;
      console.log(`[EventDetail] Attempting to toggle bookmark for event #${id}`);
      
      // Optimistically update UI for immediate feedback
      setIsBookmarked(!isBookmarked);
      
      // Add a small delay to debounce and prevent accidental double clicks
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const response = await bookmarkEvent(id);
      console.log(`[EventDetail] Bookmark API response:`, response.data);
      
      // Update state based on server response (use is_bookmarked or bookmarked field)
      const serverBookmarkState = response.data.is_bookmarked ?? response.data.bookmarked;
      setIsBookmarked(serverBookmarkState);
      
      // Show toast notification
      showToast(
        serverBookmarkState ? 'Event added to bookmarks' : 'Event removed from bookmarks',
        'success'
      );
    } catch (error) {
      console.error('Error bookmarking event:', error);
      
      // Revert UI state on error
      setIsBookmarked(!isBookmarked);
      
      // Show error toast
      showToast('Failed to update bookmark. Please try again.', 'error');
    } finally {
      // Reset bookmarking state
      setTimeout(() => {
        isBookmarkingRef.current = false;
      }, 500);
    }
  };
  
  const handleEditEvent = () => {
    navigation.navigate('EditEvent', { id });
  };
  
  const handleOpenMap = () => {
    const { location } = event;
    if (!location) return;
    
    const query = encodeURIComponent(location);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
    });
    
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open maps app');
      });
    }
  };
  
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setIsPostingComment(true);
    try {
      await addComment(id, newComment.trim());
      
      setNewComment('');
      await fetchEventDetails();
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setIsPostingComment(false);
    }
  };
  
  const handleReplyToComment = async (parentId: number, content: string) => {
    try {
      await addComment(id, content.trim(), parentId);
      
      await fetchEventDetails();
      return true;
    } catch (error) {
      console.error('Error posting reply:', error);
      Alert.alert('Error', 'Failed to post reply. Please try again.');
      return false;
    }
  };
  
  const handleDeleteComment = async (commentId: number) => {
    console.log(`[EventDetail] Starting comment deletion for comment #${commentId} in event #${id}`);
    try {
      console.log(`[EventDetail] Calling API deleteComment with eventId: ${id}, commentId: ${commentId.toString()}`);
      const response = await deleteComment(id, commentId.toString());
      console.log(`[EventDetail] Delete comment API response:`, response?.status, response?.data);
      
      // First, optimistically update the UI by removing the comment from the local state
      setComments(prevComments => {
        // Filter out the deleted comment and its replies
        const filteredComments = prevComments.filter(comment => {
          // Remove the comment itself and any replies to it 
          return comment.id !== commentId;
        });
        
        // Also remove any comment that's a direct reply to the deleted comment
        filteredComments.forEach(comment => {
          if (comment.replies) {
            comment.replies = comment.replies.filter(reply => reply.id !== commentId);
          }
        });
        
        return filteredComments;
      });
      
      // Then refresh from the server to ensure everything is in sync
      console.log(`[EventDetail] Refreshing event details after comment deletion`);
      // Add a small delay to ensure the server has processed the deletion
      setTimeout(async () => {
        await fetchEventDetails();
        console.log(`[EventDetail] Event details refreshed successfully`);
      }, 500);
      
      return true;
    } catch (error) {
      console.error('[EventDetail] Error deleting comment:', error);
      if (Platform.OS === 'web') {
        alert('Failed to delete comment. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to delete comment. Please try again.');
      }
      return false;
    }
  };
  
  const calculateUserJoined = (): boolean => {
    if (!event || !user || !event.participants) return false;
    
    return event.participants.some((participant: any) => {
      return participant.user_id === user.id;
    });
  };
  
  const formatEventDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'EEEE, MMMM do, yyyy • h:mm a');
  };
  
  const navigateToUserProfile = (userId: number) => {
    navigateToProfile(navigation, userId, user?.id);
  };
  
  const renderJoinButton = () => {
    // User is the creator
    if (user && event.creator_id === user.id) {
      return (
        <Button
          title="Edit Event"
          onPress={handleEditEvent}
          variant="outline"
          icon={<Ionicons name="create-outline" size={18} color="#4361EE" />}
          gradient={false}
          fullWidth={true}
        />
      );
    }
    
    // User already joined
    if (participationStatus === 'confirmed') {
      return (
        <Button
          title="Leave Event"
          onPress={handleLeaveEvent}
          variant="outline"
          icon={<Ionicons name="exit-outline" size={18} color="#F87171" />}
          gradient={false}
          fullWidth={true}
        />
      );
    }
    
    // Event is full
    if (event.current_players >= event.max_players) {
      return (
        <Button
          title="Event Full"
          disabled={true}
          variant="outline"
          icon={<Ionicons name="people-outline" size={18} color="#94A3B8" />}
          fullWidth={true}
          onPress={() => {}}
        />
      );
    }
    
    // User can join
    return (
      <Button
        title="Join Event"
        onPress={handleJoinEvent}
        loading={isJoining}
        icon={<Ionicons name="enter-outline" size={18} color="#FFFFFF" />}
        gradient={true}
        fullWidth={true}
      />
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361EE" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }
  
  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#F87171" />
        <Text style={styles.errorText}>Failed to load event details</Text>
        <Button
          title="Retry"
          onPress={fetchEventDetails}
          variant="outline"
          style={styles.retryButton}
        />
      </View>
    );
  }
  
  const sportGradient = getSportGradient(event.sport_type);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
        <BlurView intensity={80} style={styles.blurView}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
            <TouchableOpacity 
              style={styles.actionIconButton} 
              onPress={handleShareEvent}
            >
              <Ionicons name="share-outline" size={24} color="#1E293B" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>
      
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Image with Gradient Overlay */}
        <View style={styles.heroImageContainer}>
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} style={styles.eventImage} />
          ) : (
            <Image 
              source={require('../assets/images/default-event.jpg')} 
              style={styles.eventImage} 
            />
          )}
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageGradient}
          >
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.floatingBackButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            {/* Actions */}
            <View style={styles.floatingActions}>
              <TouchableOpacity 
                style={styles.floatingActionButton}
                onPress={handleBookmarkEvent}
                hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.floatingActionButton}
                onPress={handleShareEvent}
              >
                <Ionicons name="share-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
        
        {/* Event Content */}
        <Animated.View 
          style={[
            styles.contentContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Event Header */}
          <View style={styles.eventHeader}>
            <Badge
              label={event.sport_type}
              icon={
                event.sport_type?.toLowerCase() === 'football' ? 'football-outline' :
                event.sport_type?.toLowerCase() === 'basketball' ? 'basketball-outline' :
                event.sport_type?.toLowerCase() === 'tennis' ? 'tennisball-outline' :
                'fitness-outline'
              }
              variant="gradient"
              gradientColors={sportGradient}
              size="medium"
              pill={true}
              style={styles.sportBadge}
            />
            
            <Text style={styles.eventTitle}>{event.title}</Text>
            
            {/* Status Badge */}
            <View style={styles.statusContainer}>
              {participationStatus === 'confirmed' ? (
                <Badge
                  label="You're attending"
                  icon="checkmark-circle"
                  variant="solid"
                  color="success"
                  size="small"
                />
              ) : event.current_players >= event.max_players ? (
                <Badge
                  label="Event full"
                  icon="alert-circle"
                  variant="solid"
                  color="error"
                  size="small"
                />
              ) : (
                <Badge
                  label={`${event.current_players || 0}/${event.max_players} players`}
                  icon="people"
                  variant="solid"
                  color="primary"
                  size="small"
                />
              )}
            </View>
            
            {/* Host Info */}
            {creator && (
              <View style={styles.hostInfo}>
                <Text style={styles.hostedByText}>Hosted by</Text>
                <TouchableOpacity 
                  style={styles.hostProfile}
                  onPress={() => creator.id && navigateToUserProfile(creator.id)}
                >
                  <Avatar
                    source={creator.profile_image ? { uri: creator.profile_image } : null}
                    name={creator.username}
                    size="small"
                    gradient={true}
                  />
                  <Text style={styles.hostName}>{creator.username}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Join Button */}
          <View style={styles.joinButtonContainer}>
            {renderJoinButton()}
          </View>
          
          {/* Event Details Cards */}
          <Card
            variant="elevated"
            elevation="md"
            style={styles.detailsCard}
          >
            <View style={styles.detailRow}>
              <View style={[styles.detailIconContainer, { backgroundColor: sportGradient[0] + '20' }]}>
                <Ionicons name="calendar-outline" size={22} color={sportGradient[0]} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailText}>{formatEventDate(event.start_date)}</Text>
                {event.end_date && (
                  <Text style={styles.detailText}>to {formatEventDate(event.end_date)}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <View style={[styles.detailIconContainer, { backgroundColor: sportGradient[0] + '20' }]}>
                <Ionicons name="location-outline" size={22} color={sportGradient[0]} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailText}>{event.location}</Text>
                <TouchableOpacity onPress={handleOpenMap}>
                  <Text style={[styles.viewMapText, { color: sportGradient[0] }]}>View on Map</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
          
          {/* Description */}
          {event.description && (
            <Card
              variant="elevated"
              elevation="sm"
              style={styles.descriptionCard}
            >
              <Text style={styles.sectionTitle}>Description</Text>
              <Text 
                style={styles.descriptionText} 
                numberOfLines={showAllDescription ? undefined : 3}
              >
                {event.description}
              </Text>
              {event.description.length > 120 && (
                <TouchableOpacity
                  onPress={() => setShowAllDescription(!showAllDescription)}
                  style={styles.readMoreButton}
                >
                  <Text style={[styles.readMoreText, { color: sportGradient[0] }]}>
                    {showAllDescription ? "Show Less" : "Read More"}
                  </Text>
                </TouchableOpacity>
              )}
            </Card>
          )}
          
          {/* Participants Section */}
          <Card
            variant="elevated"
            elevation="sm"
            style={styles.participantsCard}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Participants</Text>
              <Text style={styles.participantsCount}>
                {event.current_players || 0}/{event.max_players}
              </Text>
            </View>
            
            <View style={styles.participantsList}>
              {event.participants && event.participants.length > 0 ? (
                event.participants.slice(0, 5).map((participant: any, index: number) => (
                  <TouchableOpacity 
                    key={participant.user_id} 
                    style={styles.participantItem}
                    onPress={() => navigateToUserProfile(participant.user_id)}
                  >
                    <Avatar
                      source={participant.profile_image ? { uri: participant.profile_image } : null}
                      name={participant.username}
                      size="small"
                      gradient={true}
                      gradientColors={sportGradient}
                    />
                    <Text style={styles.participantName}>{participant.username}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noParticipantsText}>No participants yet</Text>
              )}
              
              {event.participants && event.participants.length > 5 && (
                <TouchableOpacity style={styles.viewAllParticipants}>
                  <Text style={[styles.viewAllText, { color: sportGradient[0] }]}>
                    View all ({event.participants.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
          
          {/* Comments Section */}
          <Card
            variant="elevated"
            elevation="sm"
            style={styles.commentsCard}
          >
            <Text style={styles.sectionTitle}>Comments</Text>
            
            {/* Add Comment */}
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity 
                style={[
                  styles.postButton,
                  { opacity: newComment.trim() ? 1 : 0.5 }
                ]}
                onPress={handleSubmitComment}
                disabled={!newComment.trim() || isPostingComment}
              >
                {isPostingComment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
            
            {/* Comments List */}
            {comments.length > 0 ? (
              comments.map(comment => (
                <Comment
                  key={comment.id}
                  id={comment.id}
                  parentId={comment.parentId}
                  content={comment.content}
                  createdAt={comment.createdAt}
                  user={comment.user}
                  upvotes={comment.upvotes}
                  downvotes={comment.downvotes}
                  userVote={comment.userVote}
                  targetId={id}
                  targetType="event"
                  onDelete={handleDeleteComment}
                  onAddReply={async (parentId, content) => {
                    await handleReplyToComment(parentId, content);
                  }}
                  replies={comment.replies || []}
                />
              ))
            ) : (
              <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
            )}
          </Card>
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 16,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 120,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  blurView: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginHorizontal: 16,
    textAlign: 'center',
  },
  actionIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageContainer: {
    position: 'relative',
    height: 300,
    width: '100%',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 48 : 48 + (StatusBar.currentHeight || 0),
    paddingHorizontal: 16,
  },
  floatingBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingActions: {
    flexDirection: 'row',
  },
  floatingActionButton: {
    width: 42,
    height: 42,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    zIndex: 10,
  },
  contentContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: theme.colors.background,
    marginTop: -40,
    paddingBottom: 24,
  },
  eventHeader: {
    padding: 24,
    paddingBottom: 16,
  },
  sportBadge: {
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 12,
  },
  statusContainer: {
    marginBottom: 16,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostedByText: {
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  hostProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostName: {
    marginLeft: 8,
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  joinButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  detailsCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 2,
  },
  viewMapText: {
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
  },
  descriptionCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  participantsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  descriptionText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  readMoreText: {
    fontWeight: '600',
  },
  participantsCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
  },
  participantsList: {
    marginBottom: 8,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantName: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  noParticipantsText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginVertical: 8,
  },
  viewAllParticipants: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  viewAllText: {
    fontWeight: '600',
  },
  commentsCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    padding: 8,
  },
  commentInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    fontSize: 16,
    color: theme.colors.text,
    paddingHorizontal: 8,
  },
  postButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  noCommentsText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
});

export default EventDetailScreen; 