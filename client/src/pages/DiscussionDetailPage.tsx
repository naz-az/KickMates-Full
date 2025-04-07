import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  getDiscussionById, 
  voteDiscussion, 
  addDiscussionComment, 
  deleteDiscussionComment,
  deleteDiscussion 
} from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

// Import Comment component for reuse
import Comment from '../components/Comment';

interface DiscussionComment {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  username: string;
  profile_image?: string;
  parent_comment_id?: number | null;
  thumbs_up: number;
  thumbs_down: number;
  user_vote?: 'up' | 'down' | null;
  replies?: DiscussionComment[];
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
  user_vote?: 'up' | 'down' | null;
  comment_count: number;
  image_url?: string;
}

const DiscussionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: number, username: string } | null>(null);
  const [commentsSort, setCommentsSort] = useState<'newest' | 'oldest'>('newest');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Load discussion and comments
  useEffect(() => {
    const fetchDiscussion = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await getDiscussionById(id);
        setDiscussion(response.data.discussion);
        setComments(response.data.comments);
      } catch (err) {
        console.error('Error fetching discussion:', err);
        setError('Failed to load the discussion. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiscussion();
  }, [id]);

  // Vote on the discussion
  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user || !discussion || !id) return;
    
    try {
      const response = await voteDiscussion(id, voteType);
      
      // Update discussion with new vote counts
      setDiscussion({
        ...discussion,
        votes_up: response.data.discussion.votes_up,
        votes_down: response.data.discussion.votes_down,
        user_vote: response.data.discussion.user_vote
      });
    } catch (err) {
      console.error('Error voting on discussion:', err);
    }
  };

  // Submit a new comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim() || !id || submitting) return;
    
    try {
      setSubmitting(true);
      
      const response = await addDiscussionComment(
        id, 
        commentText, 
        replyTo ? replyTo.id : undefined
      );
      
      const newComment = response.data.comment;
      
      // Add the new comment to the comments list
      if (replyTo) {
        // Find the parent comment and add reply
        setComments(prevComments => prevComments.map(comment => {
          if (comment.id === replyTo.id) {
            return {
              ...comment,
              replies: [newComment, ...(comment.replies || [])]
            };
          }
          return comment;
        }));
      } else {
        // Add as a top-level comment
        setComments(prevComments => [newComment, ...prevComments]);
      }
      
      // Reset form
      setCommentText('');
      setReplyTo(null);
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a comment
  const handleDeleteComment = async (commentId: number) => {
    if (!id) return;
    
    try {
      await deleteDiscussionComment(id, commentId.toString());
      
      // Filter out the deleted comment
      const filteredComments = comments.filter(comment => comment.id !== commentId);
      setComments(filteredComments);
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Handle comment reply
  const handleReply = (commentId: number, username: string) => {
    setReplyTo({ id: commentId, username });
    
    // Focus comment input
    const commentInput = document.getElementById('comment-input');
    if (commentInput) {
      commentInput.focus();
    }
    
    // Scroll to comment form
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
      commentForm.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Add a reply to a comment
  const handleAddReply = (
    parentCommentId: number,
    content: string,
    newComment?: DiscussionComment
  ) => {
    // Update the comments state with the new reply
    setComments(comments.map(comment => {
      if (comment.id === parentCommentId) {
        return {
          ...comment,
          replies: [newComment || {
            id: Date.now(), // Temporary ID until we get response
            content,
            user_id: user?.id || 0,
            username: user?.username || '',
            profile_image: user?.profile_image,
            created_at: new Date().toISOString(),
            thumbs_up: 0,
            thumbs_down: 0
          }, ...(comment.replies || [])]
        };
      }
      return comment;
    }));
  };

  // Vote on a comment
  const handleVoteComment = async (
    commentId: number,
    _voteType: 'up' | 'down',
    newVotes: { 
      thumbs_up: number, 
      thumbs_down: number, 
      user_vote: 'up' | 'down' | null 
    }
  ) => {
    if (!id) return;
    
    try {
      // Update the comments state with the new vote count
      setComments(prevComments => updateCommentVotes(
        prevComments,
        commentId,
        newVotes
      ));
    } catch (err) {
      console.error('Error voting on comment:', err);
    }
  };

  // Helper function to update comment votes recursively
  const updateCommentVotes = (
    comments: DiscussionComment[],
    commentId: number,
    newVotes: { 
      thumbs_up: number, 
      thumbs_down: number, 
      user_vote: 'up' | 'down' | null 
    }
  ): DiscussionComment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          thumbs_up: newVotes.thumbs_up,
          thumbs_down: newVotes.thumbs_down,
          user_vote: newVotes.user_vote
        };
      } else if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentVotes(comment.replies, commentId, newVotes)
        };
      }
      return comment;
    });
  };

  // Delete the discussion
  const handleDeleteDiscussion = async () => {
    if (!id || deleting || !discussion || !user || user.id !== discussion.creator_id) return;
    
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this discussion? This action cannot be undone.'
    );
    
    if (!confirmDelete) return;
    
    try {
      setDeleting(true);
      await deleteDiscussion(id);
      navigate('/discussions');
    } catch (err) {
      console.error('Error deleting discussion:', err);
      setDeleting(false);
    }
  };

  // Organize comments into a hierarchical structure
  const organizeComments = (comments: DiscussionComment[]) => {
    const topLevelComments: DiscussionComment[] = [];
    const commentMap: Record<number, DiscussionComment> = {};
    
    // First pass: build map of comments by ID and initialize replies array
    comments.forEach(comment => {
      commentMap[comment.id] = {
        ...comment,
        replies: []
      };
    });
    
    // Second pass: organize comments into hierarchy
    comments.forEach(comment => {
      if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
        // This is a reply, add it to parent's replies
        commentMap[comment.parent_comment_id].replies?.push(commentMap[comment.id]);
      } else {
        // This is a top-level comment
        topLevelComments.push(commentMap[comment.id]);
      }
    });
    
    return topLevelComments;
  };

  // Sort and prepare comments for display
  const sortedTopLevelComments = organizeComments([...comments].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return commentsSort === 'newest' ? dateB - dateA : dateA - dateB;
  }));

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (err) {
      return dateString;
    }
  };

  // Navigate to user profile
  const navigateToUserProfile = (userId: number) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="loading-container my-8 flex justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="error-container my-8 text-center">
        <p className="text-red-500">{error || 'Discussion not found'}</p>
        <Link to="/discussions" className="btn btn-primary mt-4">
          Back to Discussions
        </Link>
      </div>
    );
  }

  return (
    <div className="discussion-detail-page max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          to="/discussions" 
          className="text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Discussions
        </Link>
      </div>
      
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-white text-center">Discussion Details</h1>
        <p className="text-indigo-100 mt-2 text-center">Explore and contribute to this conversation</p>
      </div>
      
      <div className="discussion-card bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className={`category inline-block text-black rounded text-xs px-3 min-w-20 text-center h-7 flex items-center justify-center mb-2 ${
                discussion.category === 'Basketball' ? 'bg-orange-500' :
                discussion.category === 'Football' ? 'bg-blue-600' :
                discussion.category === 'Soccer' ? 'bg-green-600' :
                discussion.category === 'Tennis' ? 'bg-yellow-500' :
                discussion.category === 'Running' ? 'bg-red-500' :
                discussion.category === 'Swimming' ? 'bg-cyan-500' :
                discussion.category === 'Cycling' ? 'bg-lime-600' :
                discussion.category === 'Yoga' ? 'bg-purple-500' :
                discussion.category === 'Fitness' ? 'bg-pink-500' :
                'bg-gray-600' // Other or fallback
              }`}>
                {discussion.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{discussion.title}</h1>
              <div className="meta text-sm text-gray-500 mt-3 flex items-center">
                <img 
                  src={discussion.profile_image || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=100&q=80'} 
                  alt={discussion.username}
                  className="w-8 h-8 rounded-full mr-2 border-2 border-indigo-100 shadow-sm cursor-pointer"
                  onClick={() => navigateToUserProfile(discussion.creator_id)}
                  title={`View ${discussion.username}'s profile`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=100&q=80";
                  }}
                />
                Posted by <span 
                  className="font-medium text-indigo-600 mx-1 cursor-pointer hover:text-indigo-800 hover:underline"
                  onClick={() => navigateToUserProfile(discussion.creator_id)}
                  title={`View ${discussion.username}'s profile`}
                >{discussion.username}</span> {formatDate(discussion.created_at)}
                {discussion.updated_at !== discussion.created_at && (
                  <span className="ml-2 text-gray-400">(Edited {formatDate(discussion.updated_at)})</span>
                )}
              </div>
            </div>
            
            {user && user.id === discussion.creator_id && (
              <div className="discussion-actions flex">
                <Link 
                  to={`/discussions/${discussion.id}/edit`}
                  className="btn btn-sm btn-outline mr-2 hover:bg-indigo-50 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit</span>
                  </div>
                </Link>
                <button 
                  onClick={handleDeleteDiscussion}
                  disabled={deleting}
                  className="btn btn-sm bg-red-100 hover:bg-red-200 text-red-600 border-red-200 hover:border-red-300"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </div>
                </button>
              </div>
            )}
          </div>
          
          <div className="content my-8 text-gray-700 leading-relaxed text-lg">
            <p className="whitespace-pre-line">{discussion.content}</p>
            
            {discussion.image_url && (
              <div className="discussion-image mt-6">
                <img 
                  src={discussion.image_url} 
                  alt={discussion.title} 
                  className="rounded-lg max-h-[500px] object-contain border border-gray-200 shadow-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=300&q=80";
                  }}
                />
              </div>
            )}
          </div>
          
          <div className="voting-actions flex items-center border-t border-gray-200 pt-6">
            <div className="vote-buttons flex items-center mr-6">
              <button 
                onClick={() => handleVote('up')} 
                disabled={!user}
                className={`vote-btn upvote flex items-center p-2 rounded-md transition-colors ${
                  discussion.user_vote === 'up' 
                    ? 'bg-green-100 text-green-600 border border-green-200' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={user ? 'Upvote' : 'Login to vote'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                <span className="ml-1 font-medium">{discussion.votes_up}</span>
              </button>
              
              <button 
                onClick={() => handleVote('down')} 
                disabled={!user}
                className={`vote-btn downvote flex items-center p-2 rounded-md ml-2 transition-colors ${
                  discussion.user_vote === 'down' 
                    ? 'bg-red-100 text-red-600 border border-red-200' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={user ? 'Downvote' : 'Login to vote'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="ml-1 font-medium">{discussion.votes_down}</span>
              </button>
            </div>
            
            <div className="vote-summary text-sm text-gray-500 flex items-center">
              <span className="font-medium text-indigo-600 mr-1">{discussion.votes_up - discussion.votes_down}</span> points • 
              <span className="ml-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {comments.length} comments
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Comment form */}
      <div id="comment-form" className="comment-form mt-8 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          {replyTo ? `Reply to ${replyTo?.username}` : 'Add a Comment'}
        </h3>
        
        {user ? (
          <form onSubmit={handleCommentSubmit} className="flex flex-col">
            {replyTo && (
              <div className="reply-indicator flex items-center bg-indigo-50 p-3 rounded-lg mb-3 border border-indigo-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span className="text-sm text-indigo-700">
                  Replying to <span className="font-semibold">{replyTo?.username}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="ml-auto text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <textarea
              id="comment-input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="What are your thoughts?"
              className="textarea textarea-bordered w-full min-h-[150px] transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            
            <div className="flex justify-between items-center mt-3">
              <div className="text-xs text-gray-500">
                {commentText.length} / 1000 characters
              </div>
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="btn bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md"
              >
                {submitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                    Submitting...
                  </>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span>{replyTo ? 'Post Reply' : 'Post Comment'}</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="login-prompt text-center py-8 bg-indigo-50 rounded-lg border border-indigo-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-indigo-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="mb-4 text-indigo-700">Please log in to join the discussion</p>
            <Link to="/login" className="btn bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md">
              Log In
            </Link>
          </div>
        )}
      </div>
      
      {/* Comments section */}
      <div className="comments-section mt-8">
        <div className="comments-header flex justify-between items-center mb-6 border-b border-gray-200 pb-3">
          <h3 className="text-xl font-semibold text-gray-800">
            Comments ({comments.length})
          </h3>
          
          <div className="sort-options">
            <div className="bg-white rounded-lg shadow-md p-2 border border-gray-200">
              <select
                value={commentsSort}
                onChange={(e) => setCommentsSort(e.target.value as 'newest' | 'oldest')}
                className="select select-sm w-full border-none shadow-none focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent"
                aria-label="Sort comments"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
        </div>
        
        {sortedTopLevelComments.length === 0 ? (
          <div className="no-comments bg-white rounded-lg shadow-md border border-gray-200 p-10 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-gray-500 text-lg">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="comments-list space-y-6">
            {sortedTopLevelComments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                onDelete={handleDeleteComment}
                onReply={handleReply}
                onAddReply={handleAddReply}
                onVote={handleVoteComment}
                eventCreatorId={discussion?.creator_id || 0}
                eventId={id || ''}
                replies={comment.replies || []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionDetailPage; 