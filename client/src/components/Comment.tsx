import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { voteComment, addComment } from '../services/api';

interface CommentType {
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
  replies?: CommentType[];
}

interface CommentProps {
  comment: CommentType;
  onDelete: (commentId: number) => void;
  onReply: (commentId: number, username: string) => void;
  onAddReply: (parentCommentId: number, content: string, newComment?: CommentType) => void;
  onVote: (commentId: number, voteType: 'up' | 'down', newVotes: { thumbs_up: number, thumbs_down: number, user_vote: 'up' | 'down' | null }) => void;
  eventCreatorId?: number;
  replies?: CommentType[];
  isReply?: boolean;
  eventId: string;
}

const Comment = ({ 
  comment, 
  onDelete, 
  onReply,
  onAddReply,
  onVote,
  eventCreatorId, 
  replies = [], 
  isReply = false,
  eventId
}: CommentProps) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isVoting, setIsVoting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      // Less than 1 day, show "Today at HH:MM"
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    } else if (diffDays < 2) {
      // Less than 2 days, show "Yesterday at HH:MM"
      return `Yesterday at ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    } else {
      // More than 2 days, show full date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Determine if user can delete the comment
  const canDelete = user && (user.id === comment.user_id || user.id === eventCreatorId);

  // Default image if none provided
  const defaultImage = 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=100&q=80';

  // Navigate to user profile
  const navigateToUserProfile = (userId: number) => {
    navigate(`/profile/${userId}`);
  };

  // Handle vote
  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) return;
    if (isVoting) return;
    
    try {
      setIsVoting(true);
      const response = await voteComment(eventId, comment.id.toString(), voteType);
      onVote(comment.id, voteType, response.data.comment);
    } catch (err) {
      console.error('Error voting on comment:', err);
    } finally {
      setIsVoting(false);
    }
  };

  // Handle reply
  const handleReplyClick = () => {
    if (!user) return;
    setShowReplyForm(true);
    onReply(comment.id, comment.username);
  };

  // Submit reply
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyText.trim() || isSubmittingReply) return;
    
    try {
      setIsSubmittingReply(true);
      const response = await addComment(eventId, replyText, comment.id);
      // Pass the full response data to ensure UI is updated with server data
      onAddReply(comment.id, replyText, response.data.comment);
      setReplyText('');
      setShowReplyForm(false);
    } catch (err) {
      console.error('Error submitting reply:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className={`comment ${isReply ? 'comment-reply' : ''}`}>
      <div className="comment-main">
        <div className="comment-avatar">
          <img 
            src={comment.profile_image || defaultImage} 
            alt={comment.username} 
            className="cursor-pointer"
            onClick={() => navigateToUserProfile(comment.user_id)}
            title={`View ${comment.username}'s profile`}
          />
        </div>
        
        <div className="comment-content">
          <div className="comment-header">
            <h4 
              className="comment-username cursor-pointer hover:text-indigo-600 hover:underline"
              onClick={() => navigateToUserProfile(comment.user_id)}
              title={`View ${comment.username}'s profile`}
            >{comment.username}</h4>
            <span className="comment-date">{formatDate(comment.created_at)}</span>
          </div>
          
          <p className="comment-text">{comment.content}</p>
          
          <div className="comment-actions">
            <div className="flex items-center">
              {user && (
                <button 
                  className="comment-reply-btn" 
                  onClick={handleReplyClick}
                >
                  Reply
                </button>
              )}
              
              <div className="comment-votes">
                <button 
                  className={`vote-btn upvote ${comment.user_vote === 'up' ? 'active' : ''}`}
                  onClick={() => handleVote('up')}
                  disabled={!user || isVoting}
                  aria-label="Thumbs up"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  <span>{comment.thumbs_up}</span>
                </button>
                
                <button 
                  className={`vote-btn downvote ${comment.user_vote === 'down' ? 'active' : ''}`}
                  onClick={() => handleVote('down')}
                  disabled={!user || isVoting}
                  aria-label="Thumbs down"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                  </svg>
                  <span>{comment.thumbs_down}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {canDelete && (
          <button 
            className="delete-comment" 
            onClick={() => onDelete(comment.id)}
            aria-label="Delete comment"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Inline reply form */}
      {showReplyForm && user && (
        <form className="inline-reply-form" onSubmit={handleSubmitReply}>
          <img 
            src={user.profile_image || defaultImage} 
            alt={user.username}
            className="cursor-pointer"
            onClick={() => navigateToUserProfile(user.id)}
            title={`View your profile`}
          />
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${comment.username}...`}
            required
            disabled={isSubmittingReply}
            autoFocus
          />
          <button 
            type="submit" 
            disabled={isSubmittingReply || !replyText.trim()}
          >
            Reply
          </button>
        </form>
      )}

      {/* Render replies */}
      {replies.length > 0 && (
        <div className="comment-replies">
          {replies.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              onDelete={onDelete}
              onReply={onReply}
              onAddReply={onAddReply}
              onVote={onVote}
              eventCreatorId={eventCreatorId}
              isReply={true}
              eventId={eventId}
              replies={reply.replies || []}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
