import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../services/api';
import { NotificationContext } from '../context/NotificationContext';

// Types
interface Notification {
  id: number;
  type: 'event_invite' | 'event_update' | 'event_reminder' | 'comment' | 'join_request' | 'join_accepted' | 'system';
  content: string;
  related_id?: number;
  is_read: boolean;
  created_at: string;
  sender_id?: number; // User ID of the notification sender (available from API)
  sender_image?: string; // Profile image URL of the sender (available from API)
}

interface UserInfo {
  username: string;
  userId?: number;
  restOfContent: string;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { decrementCount, refreshCount } = useContext(NotificationContext);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
    // Refresh notification count in case it's out of sync
    refreshCount();
  }, [refreshCount]);

  // Function to fetch notifications from the API
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getNotifications();
      setNotifications(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Extract username from notification content if present
  const extractUsername = (notification: Notification): UserInfo | null => {
    const { content, related_id, type, sender_id } = notification;
    
    // Check for patterns like "Jane Smith has invited you" or "John Doe commented on"
    const usernamePattern = /^([A-Z][a-z]+(?: [A-Z][a-z]+)*) (has |commented |replied |wants to |has updated )/;
    const match = content.match(usernamePattern);
    
    if (match && match[1]) {
      const username = match[1];
      const restOfContent = content.replace(username, '').trim();
      
      // First try to use sender_id if available (direct reference to the user)
      let userId: number | undefined = sender_id;
      
      // If sender_id is not available, fallback to related_id for certain notification types
      if (!userId && related_id && ['join_request', 'comment', 'event_invite'].includes(type)) {
        userId = related_id;
      }
      
      return { username, userId, restOfContent };
    }
    
    return null;
  };
  
  // Navigate to user profile
  const navigateToUserProfile = (userInfo: UserInfo) => {
    if (userInfo.userId) {
      // Direct navigation to profile page if we have userId
      navigate(`/profile/${userInfo.userId}`);
    } else {
      // Fallback to search by username
      navigate(`/members?search=${encodeURIComponent(userInfo.username)}`);
    }
  };

  // Get default profile image
  const getDefaultProfileImage = () => {
    // Use the same default image URL as in EventDetailPage for consistency
    return 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=100&q=80';
  };

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 24) {
      // Less than a day ago
      if (diffInHours < 1) {
        const minutes = Math.floor(diffInHours * 60);
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      } else {
        const hours = Math.floor(diffInHours);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      }
    } else if (diffInHours < 48) {
      // Yesterday
      return 'Yesterday';
    } else {
      // Format as date
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Handle marking a notification as read
  const handleMarkAsRead = async (id: number) => {
    try {
      const notification = notifications.find(n => n.id === id);
      const wasUnread = notification && !notification.is_read;
      
      await markNotificationAsRead(id.toString());
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
      
      // Decrement the unread count if the notification was previously unread
      if (wasUnread) {
        decrementCount(1);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setError('Failed to update notification. Please try again.');
    }
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      
      // Count how many notifications were unread before
      const unreadCount = notifications.filter(n => !n.is_read).length;
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      
      // Decrement the unread count
      if (unreadCount > 0) {
        decrementCount(unreadCount);
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      setError('Failed to update notifications. Please try again.');
    }
  };

  // Handle deleting a notification
  const handleDelete = async (id: number) => {
    try {
      const notification = notifications.find(n => n.id === id);
      const wasUnread = notification && !notification.is_read;
      
      await deleteNotification(id.toString());
      
      setNotifications(prev => 
        prev.filter(notification => notification.id !== id)
      );
      
      // If we deleted an unread notification, decrement the count
      if (wasUnread) {
        decrementCount(1);
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
      setError('Failed to delete notification. Please try again.');
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'event_invite':
        return '📩'; // Envelope
      case 'event_update':
        return '📝'; // Memo
      case 'event_reminder':
        return '⏰'; // Alarm Clock
      case 'comment':
        return '💬'; // Speech Bubble
      case 'join_request':
        return '👋'; // Waving Hand
      case 'join_accepted':
        return '✅'; // Check Mark
      case 'system':
        return '🔔'; // Bell
      default:
        return '📢'; // Loudspeaker
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm mb-6 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Notifications</h1>
              <p className="text-gray-600 mt-1">Stay updated with your activities</p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No notifications yet</h2>
            <p className="text-gray-500">
              You don't have any notifications at the moment.
              <br />
              Check back later for updates!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const userInfo = extractUsername(notification);
              
              return (
                <div 
                  key={notification.id} 
                  className={`bg-white rounded-xl shadow-sm p-4 md:p-6 transition-all ${
                    !notification.is_read ? 'border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex">
                    <div className="flex-shrink-0 mr-4 text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div className={`${!notification.is_read ? 'font-medium' : ''} text-gray-800`}>
                          {userInfo ? (
                            <div className="flex items-center">
                              <img 
                                src={notification.sender_image || getDefaultProfileImage()} 
                                alt={userInfo.username}
                                className="w-8 h-8 rounded-full mr-2 object-cover cursor-pointer hover:ring-2 hover:ring-primary"
                                onClick={() => navigateToUserProfile(userInfo)}
                                title={`View ${userInfo.username}'s profile`}
                              />
                              <span>
                                <span 
                                  className="font-medium text-indigo-600 hover:underline cursor-pointer"
                                  onClick={() => navigateToUserProfile(userInfo)}
                                >
                                  {userInfo.username}
                                </span>
                                {' '}{userInfo.restOfContent}
                              </span>
                            </div>
                          ) : (
                            <p>{notification.content}</p>
                          )}
                        </div>
                        
                        <div className="flex space-x-1 ml-4">
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-800" 
                              title="Mark as read"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="text-gray-400 hover:text-red-600" 
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="text-gray-500 text-sm mt-1">
                        {formatDate(notification.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage; 