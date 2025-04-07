import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById, joinEvent, leaveEvent, bookmarkEvent, addComment, deleteComment, deleteEvent } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Comment from '../components/Comment';
import { formatImageUrl } from '../utils/imageUtils';

interface EventDetailPageProps {
  deleteMode?: boolean;
}

const EventDetailPage = ({ deleteMode = false }: EventDetailPageProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [event, setEvent] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [participationStatus, setParticipationStatus] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [commentsSort, setCommentsSort] = useState<'newest' | 'oldest'>('newest');
  const [commentPage, setCommentPage] = useState(1);
  const commentsPerPage = 5;
  const [_replyToComment, setReplyToComment] = useState<{id: number, username: string} | null>(null);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteEventConfirmation, setShowDeleteEventConfirmation] = useState(deleteMode);

  // Add a function to get bookmark key for local storage
  const getBookmarkKey = useCallback((eventId: string, userId?: number) => {
    return `kickmates_bookmark_${eventId}_${userId || 'anonymous'}`;
  }, []);

  // Load initial bookmark state from local storage
  useEffect(() => {
    if (id && user) {
      const bookmarkKey = getBookmarkKey(id, user.id);
      const cachedBookmark = localStorage.getItem(bookmarkKey);
      if (cachedBookmark) {
        setIsBookmarked(cachedBookmark === 'true');
        // console.log("Loaded bookmark state from cache:", cachedBookmark === 'true');
      }
    }
  }, [id, user, getBookmarkKey]);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  useEffect(() => {
    // If in delete mode, show the delete confirmation when the event is loaded
    if (deleteMode && event && !showDeleteEventConfirmation) {
      setShowDeleteEventConfirmation(true);
    }
  }, [deleteMode, event]);

  // Add a debug effect to log when participation status changes
  // useEffect(() => {
    // console.log("Participation status changed to:", participationStatus);
  // }, [participationStatus]);

  const fetchEventDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      //console.log("Fetching event details for ID:", id);
      // console.log("Using auth token:", token ? "Present" : "Missing");
      
      const response = await getEventById(id!);
      //console.log("Raw API response:", response);
      
      const { event, participants, comments, isBookmarked: serverBookmarked, participationStatus } = response.data;
      
      // console.log("Received event details. Server bookmark status:", serverBookmarked);
      
      // Check if the user is in the participants array for debugging
      if (user) {
        // Removed unused userInParticipants variable
        
        // Check localStorage for bookmark state
        const bookmarkKey = getBookmarkKey(id!, user.id);
        const cachedBookmark = localStorage.getItem(bookmarkKey);
        
        if (cachedBookmark !== null) {
          // console.log("Local bookmark cache:", cachedBookmark);
          // If server and local storage disagree, prefer local storage but update server silently
          const localBookmarked = cachedBookmark === 'true';
          if (serverBookmarked !== localBookmarked) {
            //console.log("Bookmark state mismatch - Local:", localBookmarked, "Server:", serverBookmarked);
            // Set UI state to cached value
            setIsBookmarked(localBookmarked);
            // Silently sync with server (no await to not block rendering)
            try {
              bookmarkEvent(id!).then(response => {
                // console.log("Silent bookmark sync response:", response.data);
                // Update local storage with latest server value
                localStorage.setItem(bookmarkKey, String(response.data.bookmarked));
              });
            } catch (err) {
              //console.error("Silent bookmark sync failed:", err);
            }
          } else {
            // If they match, use the server value
            setIsBookmarked(serverBookmarked);
          }
        } else {
          // If no local cache, use server value and create cache
          setIsBookmarked(serverBookmarked);
          localStorage.setItem(bookmarkKey, String(serverBookmarked));
        }
      } else {
        // If no user, just use server value
        setIsBookmarked(serverBookmarked);
      }
      
      setEvent(event);
      setParticipants(participants);
      setComments(comments);
      setParticipationStatus(participationStatus);
      
      // console.log("Updated state with participation status:", participationStatus);
      
      // If participationStatus is null but the user is in the participants array
      // This is a workaround for backend inconsistency 
      if (!participationStatus && user && participants.some((p: any) => p.user_id === user.id)) {
        const userParticipant = participants.find((p: any) => p.user_id === user.id);
        //console.log("WARNING: Inconsistency detected! Setting participation status from participants array:", userParticipant.status);
        setParticipationStatus(userParticipant.status);
      }
      
      // Update the current_players count to match confirmed participants count
      const confirmedCount = participants.filter((p: any) => p.status === 'confirmed').length;
      setEvent((prevEvent: any) => ({
        ...prevEvent,
        current_players: confirmedCount
      }));
      
    } catch (err: any) {
      //console.error('Error fetching event details:', err);
      
      if (err.response) {
        //console.error('Response status:', err.response.status);
        //console.error('Response data:', err.response.data);
      }
      
      setError('Failed to load event details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinEvent = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    
    //console.log("Attempting to join event with ID:", id);
    
    try {
      const response = await joinEvent(id!);
      //console.log("Join event API response:", response.data);
      
      // Directly update participation status without waiting for fetchEventDetails
      // This ensures immediate UI feedback
      setParticipationStatus(response.data.status);
      
      // Create a new participant entry for optimistic UI update
      if (user && !participants.some(p => p.user_id === user.id)) {
        const newParticipant = {
          id: Date.now(), // Temporary ID until refresh
          user_id: user.id,
          status: response.data.status,
          joined_at: new Date().toISOString(),
          username: user.username,
          profile_image: user.profile_image
        };
        
        // Add user to participants array
        setParticipants(prevParticipants => [...prevParticipants, newParticipant]);
        
        // Update event current_players count if confirmed
        if (response.data.status === 'confirmed') {
          setEvent((prevEvent: any) => ({
            ...prevEvent,
            current_players: prevEvent.current_players + 1
          }));
        }
        
        //console.log("Optimistically added user to participants:", newParticipant);
      }
      
      // Now refresh all event details to get latest data
      await fetchEventDetails();
      
    } catch (err: any) {
      //console.error('Error joining event:', err);
      
      // If the error is because user is already participating, directly check participants
      if (err.response && err.response.status === 400 && 
          err.response.data && err.response.data.message && 
          err.response.data.message.includes('already participating')) {
        
        //console.log("User is already participating, checking participants data");
        
        try {
          // Fetch fresh data
          const detailsResponse = await getEventById(id!);
          const { participants, event } = detailsResponse.data;
          
          // Find user in participants
          if (user && participants.some((p: any) => p.user_id === user.id)) {
            const userParticipation = participants.find((p: any) => p.user_id === user.id);
            //console.log("FIXING DATA: Setting status to", userParticipation.status);
            
            // Manually set status and update UI
            setParticipationStatus(userParticipation.status);
            setParticipants(participants);
            setEvent(event);
          }
        } catch (detailsErr) {
          //console.error("Failed to fetch details for fixup:", detailsErr);
        }
        
        return;
      }
      
      setError('Failed to join event. Please try again.');
    }
  };

  const handleLeaveEvent = async () => {
    try {
      // Update the UI first for better user experience
      setParticipationStatus(null);
      
      // Optimistically remove user from participants array
      if (user) {
        setParticipants(prevParticipants => {
          return prevParticipants.filter(p => p.user_id !== user.id);
        });
        
        // If user was a confirmed participant, decrement the count
        if (participationStatus === 'confirmed') {
          setEvent((prevEvent: any) => ({
            ...prevEvent,
            current_players: prevEvent.current_players > 0 ? prevEvent.current_players - 1 : 0
          }));
        }
        
        //console.log("Optimistically removed user from participants");
      }
      
      await leaveEvent(id!);
      //console.log("Leave event API response:", response.data);
      
      // Refresh event details to update waiting list promotions, etc.
      await fetchEventDetails();
    } catch (err: any) {
      //console.error('Error leaving event:', err);
      
      if (err.response) {
        //console.error('Response status:', err.response.status);
        //console.error('Response data:', err.response.data);
      }
      
      // Refresh data to restore correct state in case of error
      fetchEventDetails();
      setError('Failed to leave event. Please try again.');
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    
    try {
      // Set loading state for bookmark button
      setIsBookmarking(true);
      
      // Optimistic UI update for immediate feedback
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);
      
      // Update local storage immediately for persistence
      if (id && user) {
        const bookmarkKey = getBookmarkKey(id, user.id);
        localStorage.setItem(bookmarkKey, String(newBookmarkState));
        //console.log("Cached bookmark state:", newBookmarkState);
      }
      
      //console.log("Toggling bookmark for event:", id);
      const response = await bookmarkEvent(id!);
      //console.log("Bookmark API response:", response.data);
      
      // Update state with server response
      const serverBookmarkState = response.data.bookmarked;
      setIsBookmarked(serverBookmarkState);
      
      // Update local storage with server state
      if (id && user) {
        const bookmarkKey = getBookmarkKey(id, user.id);
        localStorage.setItem(bookmarkKey, String(serverBookmarkState));
      }
      
      // Log for debugging
      //console.log("Updated bookmark status:", response.data.bookmarked);
    } catch (err: any) {
      //console.error('Error bookmarking event:', err);
      
      // Revert to original state if there was an error
      setIsBookmarked(isBookmarked);
      
      if (err.response) {
        //console.error('Response status:', err.response.status);
        //console.error('Response data:', err.response.data);
      }
      
      setError('Failed to bookmark event. Please try again.');
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !commentText.trim() || isSubmittingComment) return;
    
    try {
      setIsSubmittingComment(true);
      const response = await addComment(id!, commentText);
      
      // Add the new comment to the state and reset form
      const newComment = response.data.comment;
      setComments(prevComments => [newComment, ...prevComments]);
      setCommentText('');
      setReplyToComment(null);
    } catch (err) {
      //console.error('Error submitting comment:', err);
      setError('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    
    try {
      try {
        await deleteComment(id!, commentToDelete.toString());
      } catch (err: any) {
        //console.error('Error deleting comment:', err);
        
        // If comment doesn't exist on server (404), we should still remove it from the UI
        if (err.response && err.response.status === 404) {
          //console.log('Comment not found on server, but removing from UI');
        } else {
          // For other errors, alert the user and abort
          setError('Failed to delete comment. Please try again.');
          setShowDeleteCommentModal(false);
          return;
        }
      }
      
      // Filter out the deleted comment and any replies to it
      const filteredComments = comments.filter(comment => {
        return comment.id !== commentToDelete && comment.parent_comment_id !== commentToDelete;
      });
      
      setComments(filteredComments);
      
      // If we're on a page that would now be empty, go back one page
      const maxPage = Math.ceil(filteredComments.length / commentsPerPage);
      if (commentPage > maxPage && maxPage > 0) {
        setCommentPage(maxPage);
      }
    } catch (err) {
      //console.error('Unexpected error in confirmDeleteComment:', err);
    } finally {
      setShowDeleteCommentModal(false);
      setCommentToDelete(null);
    }
  };

  const handleReplyToComment = (commentId: number, username: string) => {
    // We no longer need to set the replyToComment state since replies are handled inline
    // This is only kept for backwards compatibility but doesn't affect the UI
    setReplyToComment({ id: commentId, username });
  };

  const handleAddReply = async (parentCommentId: number, content: string, newComment: any = null) => {
    if (!user) return;
    
    try {
      // If we don't already have the new comment data from the reply component
      if (!newComment) {
        const response = await addComment(id!, content, parentCommentId);
        newComment = response.data.comment;
      }
      
      // Add new comment to the state
      setComments(prevComments => [newComment, ...prevComments]);
      
      // Fetch event details to properly update the nested comment structure
      fetchEventDetails();
    } catch (err) {
      //console.error('Error adding reply:', err);
      setError('Failed to add reply. Please try again.');
    }
  };

  const handleVoteOnComment = (commentId: number, _voteType: 'up' | 'down', newVotes: any) => {
    // Update the comments state with the new vote count
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          thumbs_up: newVotes.thumbs_up,
          thumbs_down: newVotes.thumbs_down,
          user_vote: newVotes.user_vote
        };
      }
      return comment;
    }));
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Organize comments into a hierarchical structure
  const organizeComments = (comments: any[]) => {
    const topLevelComments: any[] = [];
    const commentMap: Record<number, any> = {};
    
    // First pass: build map of comments by ID and initialize replies array
    comments.forEach(comment => {
      commentMap[comment.id] = {
        ...comment,
        replies: []
      };
    });
    
    // Second pass: organize into parent-child relationship
    comments.forEach(comment => {
      if (comment.parent_comment_id) {
        // This is a reply, add it to its parent's replies
        if (commentMap[comment.parent_comment_id]) {
          commentMap[comment.parent_comment_id].replies.push(commentMap[comment.id]);
        } else {
          // If parent doesn't exist (shouldn't happen), treat as top-level
          topLevelComments.push(commentMap[comment.id]);
        }
      } else {
        // This is a top-level comment
        topLevelComments.push(commentMap[comment.id]);
      }
    });
    
    // Sort replies by date
    Object.values(commentMap).forEach((comment: any) => {
      comment.replies.sort((a: any, b: any) => {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    });
    
    return topLevelComments;
  };

  // Sort and paginate comments
  const sortedTopLevelComments = organizeComments([...comments].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return commentsSort === 'newest' ? dateB - dateA : dateA - dateB;
  }));

  const paginatedComments = sortedTopLevelComments.slice(
    (commentPage - 1) * commentsPerPage, 
    commentPage * commentsPerPage
  );

  const totalPages = Math.ceil(sortedTopLevelComments.length / commentsPerPage);

  // Button components to avoid repetition and ensure consistency
  const JoinButton = () => {
    //console.log("Rendering JoinButton. User:", user?.id, "isFull:", isFull);
    return (
      <button 
        onClick={handleJoinEvent}
        className="btn btn-primary join-btn"
        disabled={isFull && Boolean(user)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        {isFull ? 'Join Waiting List' : 'Join Event'}
      </button>
    );
  };

  const LeaveButton = () => {
    // console.log("Rendering LeaveButton. Status:", participationStatus);
    
    const openLeaveModal = () => {
      setShowLeaveModal(true);
    };

    const confirmLeave = () => {
      handleLeaveEvent();
      setShowLeaveModal(false);
    };
    
    return (
      <>
        <button 
          onClick={openLeaveModal}
          className="btn bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm border border-green-700"
          title={participationStatus === 'confirmed' ? 'You are confirmed for this event' : 'You are on the waiting list'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Joining
        </button>

        {/* Leave Event Confirmation Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-red-700">Leave Event</h3>
                <button 
                  onClick={() => setShowLeaveModal(false)}
                  className="text-gray-500 hover:text-gray-800"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-800 mb-4">
                  Are you sure you want to leave this event? {participationStatus === 'confirmed' && 'Your spot may be given to someone on the waiting list.'}
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-5">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmLeave}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Leave Event
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // Get confirmed and waiting participants - moved to inside the component
  // to ensure these are updated whenever participants state changes
  const confirmedParticipants = participants.filter(p => p.status === 'confirmed');
  const waitingParticipants = participants.filter(p => p.status === 'waiting');

  // Navigate to user profile
  const navigateToUserProfile = (userId: number) => {
    navigate(`/profile/${userId}`);
  };

  // Default image if none provided
  const defaultImage = 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80';

  // Calculate if event is full - moved after event null check
  const isFull = event?.current_players >= event?.max_players;
  
  const handleDeleteEvent = async () => {
    if (!user || !event || user.id !== event.creator_id) {
      setError('You do not have permission to delete this event');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteEvent(id!);
      // Redirect to events page after successful deletion
      navigate('/events', { state: { message: 'Event deleted successfully' } });
    } catch (err: any) {
      //console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again.');
      setIsDeleting(false);
      setShowDeleteEventConfirmation(false);
    }
  };

  const cancelDeleteEvent = () => {
    setShowDeleteEventConfirmation(false);
    // Only navigate away if in deleteMode
    if (deleteMode) {
      navigate(`/events/${id}`);
    }
  };

  // Add this right after the LeaveButton component, before the isParticipant function
  const DeleteEventModal = () => {
    // If in delete mode but event isn't loaded yet, show a spinner
    if (deleteMode && !event && isLoading) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-center mt-4">Loading event details...</p>
          </div>
        </div>
      );
    }
    
    // If in delete mode but there was an error loading the event
    if (deleteMode && !event && !isLoading) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-red-600">Error</h3>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Unable to load event details. The event may have been deleted or you don't have permission to access it.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => navigate('/events')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Back to Events
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Show the modal if showDeleteEventConfirmation is true, regardless of deleteMode
    if (!showDeleteEventConfirmation) {
      return null;
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Delete Event</h3>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this event? This action cannot be undone and will remove all related
            comments, participants, and bookmarks.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelDeleteEvent}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteEvent}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : 'Delete Event'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !showDeleteEventConfirmation) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4" role="alert">
        <p>{error}</p>
        <button 
          onClick={() => navigate('/events')} 
          className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-lg"
        >
          Back to Events
        </button>
      </div>
    );
  }

  // If in delete mode, show only the confirmation dialog
  if (deleteMode) {
    return <DeleteEventModal />;
  }

  // Add a check for event existence
  if (!event) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4" role="alert">
          <p>Event not found or failed to load. Please try again.</p>
          <button 
            onClick={() => navigate('/events')} 
            className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-lg"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-detail-page">
      <div className="event-detail-header">
        <div 
          className="event-cover-image"
          style={{ backgroundImage: `url(${formatImageUrl(event.image_url, defaultImage)})` }}
        ></div>
        
        <div className="event-header-content">
          <h1 className="event-title">{event.title}</h1>
          
          <div className="event-meta">
            <div className="event-sport-type">
              <span className="label">Sport:</span>
              <span className="value sport-type">{event.sport_type}</span>
            </div>
            
            <div className="event-host">
              <span className="label">Hosted by:</span>
              <span 
                className="value cursor-pointer hover:text-indigo-600 hover:underline"
                onClick={() => navigateToUserProfile(event.creator_id)}
                title={`View ${event.creator_name}'s profile`}
              >{event.creator_name}</span>
            </div>
          </div>
          
          <div className="event-actions">
            {/* Event Actions */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {/* Join/Leave Button */}
              {user && user.id !== event.creator_id && (
                <>
                  {!participationStatus && <JoinButton />}
                  {participationStatus && <LeaveButton />}
                </>
              )}
              
              {/* Edit/Delete Buttons for event creator */}
              {user && user.id === event.creator_id && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/events/${id}/edit`)}
                    className="btn-primary py-2 px-4 rounded-md"
                  >
                    Edit Event
                  </button>
                  <button 
                    onClick={() => setShowDeleteEventConfirmation(true)}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
                  >
                    Delete Event
                  </button>
                </div>
              )}
              
              {/* Bookmark button */}
              <button 
                onClick={handleBookmark}
                className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
                aria-label={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
                disabled={isBookmarking}
              >
                {isBookmarking ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Bookmarking...
                  </>
                ) : isBookmarked ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                    Bookmarked
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Bookmark
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="event-detail-content">
        <div className="event-main-content">
          <div className="event-details-card">
            <h3>Event Details</h3>
            
            <div className="detail-item">
              <span className="detail-icon">📍</span>
              <div className="detail-content">
                <span className="detail-label">Location</span>
                <span className="detail-value">{event.location}</span>
              </div>
            </div>
            
            <div className="detail-item">
              <span className="detail-icon">📅</span>
              <div className="detail-content">
                <span className="detail-label">Date</span>
                <span className="detail-value">{formatDate(event.start_date)}</span>
              </div>
            </div>
            
            <div className="detail-item">
              <span className="detail-icon">🕒</span>
              <div className="detail-content">
                <span className="detail-label">Time</span>
                <span className="detail-value">
                  {formatTime(event.start_date)} - {formatTime(event.end_date)}
                </span>
              </div>
            </div>
            
            <div className="detail-item">
              <span className="detail-icon">👥</span>
              <div className="detail-content">
                <span className="detail-label">Participants</span>
                <span className="detail-value">
                  <span className={confirmedParticipants.length >= event.max_players ? 'text-error' : 'text-success'}>
                    {confirmedParticipants.length}/{event.max_players}
                  </span> participants
                </span>
              </div>
            </div>
            
            <div className="event-description">
              <h4>Description</h4>
              <p className="whitespace-pre-line">{event.description || 'No description provided.'}</p>
            </div>
          </div>
          
          <div className="event-comments-section">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
              <h3 className="flex items-center text-xl font-bold m-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comments {comments.length > 0 && `(${comments.length})`}
              </h3>
              
              {comments.length > 0 && (
                <div className="flex items-center gap-3">
                  <label htmlFor="comments-sort" className="text-sm text-text-light">
                    Sort by:
                  </label>
                  <select 
                    id="comments-sort" 
                    className="text-sm p-1 border border-gray-200 rounded"
                    value={commentsSort}
                    onChange={(e) => setCommentsSort(e.target.value as 'newest' | 'oldest')}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>
              )}
            </div>
            
            {user ? (
              <form className="comment-form" onSubmit={handleCommentSubmit}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="shrink-0">
                    <img 
                      src={user.profile_image ? formatImageUrl(user.profile_image, defaultImage) : 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=100&q=80'} 
                      alt={user.username} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm cursor-pointer"
                      onClick={() => navigateToUserProfile(user.id)}
                      title={`View ${user.username}'s profile`}
                    />
                  </div>
                  <div className="flex-grow">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      rows={3}
                      required
                      disabled={isSubmittingComment}
                      className="w-full"
                    />
                    <div className="flex justify-end mt-2">
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isSubmittingComment || !commentText.trim()}
                      >
                        {isSubmittingComment ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Posting...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Post Comment
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="login-prompt">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto mb-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <p>Please <a onClick={() => navigate('/login', { state: { from: `/events/${id}` } })} className="font-medium">login</a> to leave a comment.</p>
              </div>
            )}
            
            {comments.length > 0 ? (
              <>
                <div className="comments-list">
                  {paginatedComments.map((comment) => (
                    <Comment 
                      key={comment.id} 
                      comment={comment} 
                      onDelete={handleDeleteComment}
                      onReply={handleReplyToComment}
                      onAddReply={handleAddReply}
                      onVote={handleVoteOnComment}
                      eventCreatorId={event.creator_id}
                      replies={comment.replies}
                      eventId={id!}
                    />
                  ))}
                </div>
                
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => setCommentPage(page => Math.max(page - 1, 1))}
                      disabled={commentPage === 1}
                      className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      aria-label="Previous page"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <span className="text-sm text-text-light">
                      Page {commentPage} of {totalPages}
                    </span>
                    
                    <button 
                      onClick={() => setCommentPage(page => Math.min(page + 1, totalPages))}
                      disabled={commentPage === totalPages}
                      className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      aria-label="Next page"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-comments">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="event-sidebar">
          <div className="participants-card">
            <h3>Participants ({confirmedParticipants.length}/{event.max_players})</h3>
            
            <div className="participants-list">
              {confirmedParticipants.length > 0 ? (
                confirmedParticipants.map((participant) => (
                  <div key={participant.id} className="participant">
                    <img 
                      src={participant.profile_image ? formatImageUrl(participant.profile_image, defaultImage) : 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=100&q=80'} 
                      alt={participant.username} 
                      className="participant-avatar cursor-pointer"
                      onClick={() => navigateToUserProfile(participant.user_id)}
                      title={`View ${participant.username}'s profile`}
                    />
                    <span 
                      className="participant-name cursor-pointer hover:text-indigo-600 hover:underline"
                      onClick={() => navigateToUserProfile(participant.user_id)}
                      title={`View ${participant.username}'s profile`}
                    >{participant.username}</span>
                  </div>
                ))
              ) : (
                <p className="text-text-light text-center py-2">No participants yet</p>
              )}
            </div>
            
            {waitingParticipants.length > 0 && (
              <>
                <h4>Waiting List ({waitingParticipants.length})</h4>
                <div className="waiting-list">
                  {waitingParticipants.map((participant) => (
                    <div key={participant.id} className="participant waiting">
                      <img 
                        src={participant.profile_image ? formatImageUrl(participant.profile_image, defaultImage) : 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=100&q=80'} 
                        alt={participant.username} 
                        className="participant-avatar cursor-pointer"
                        onClick={() => navigateToUserProfile(participant.user_id)}
                        title={`View ${participant.username}'s profile`}
                      />
                      <span 
                        className="participant-name cursor-pointer hover:text-indigo-600 hover:underline"
                        onClick={() => navigateToUserProfile(participant.user_id)}
                        title={`View ${participant.username}'s profile`}
                      >{participant.username}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Comment Confirmation Modal */}
      {showDeleteCommentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-red-700">Delete Comment</h3>
              <button 
                onClick={() => setShowDeleteCommentModal(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-800 mb-4">
                Are you sure you want to delete this comment? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 mt-5">
              <button
                type="button"
                onClick={() => setShowDeleteCommentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteComment}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete Comment
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Event Modal */}
      <DeleteEventModal />
    </div>
  );
};

export default EventDetailPage; 