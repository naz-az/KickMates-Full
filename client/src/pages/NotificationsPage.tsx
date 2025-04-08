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
  sender_id?: number;
  sender_image?: string;
  sender_username?: string;
  current_sender_image?: string;
}

interface UserInfo {
  username: string;
  userId?: number;
  restOfContent: string;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { decrementCount, refreshCount } = useContext(NotificationContext);
  const [validImageUrls, setValidImageUrls] = useState<Record<string, boolean>>({});

  // Create type filters
  const notificationTypes = [
    { id: 'all', label: 'All', icon: '🔔' },
    { id: 'event_invite', label: 'Invites', icon: '📩' },
    { id: 'event_update', label: 'Updates', icon: '📝' },
    { id: 'comment', label: 'Comments', icon: '💬' },
    { id: 'join_request', label: 'Requests', icon: '👋' },
    { id: 'join_accepted', label: 'Accepted', icon: '✅' },
  ];

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
    // Refresh notification count in case it's out of sync
    refreshCount();
  }, [refreshCount]);

  // Apply filters when notifications, activeFilter, or unread filter changes
  useEffect(() => {
    let filtered = [...notifications];
    
    // Apply type filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === activeFilter);
    }
    
    // Apply unread filter if enabled
    if (showUnreadOnly) {
      filtered = filtered.filter(n => !n.is_read);
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, activeFilter, showUnreadOnly]);

  // Function to fetch notifications from the API
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getNotifications();
      console.log('Raw notifications data:', JSON.stringify(response.data, null, 2));
      
      // Check which notifications have images and which don't
      const withImages = response.data.filter((n: Notification) => n.sender_image || n.current_sender_image);
      const withoutImages = response.data.filter((n: Notification) => !n.sender_image && !n.current_sender_image);
      
      console.log(`Notifications with images: ${withImages.length}, without images: ${withoutImages.length}`);
      
      if (withImages.length > 0) {
        console.log('Sample notification with image:', withImages[0]);
      }
      
      if (withoutImages.length > 0) {
        console.log('Sample notification without image:', withoutImages[0]);
      }
      
      setNotifications(response.data);
      
      // Validate image URLs for all notifications with sender images
      const notificationsWithImages = response.data.filter(
        (notification: Notification) => notification.sender_image
      );
      
      for (const notification of notificationsWithImages) {
        if (notification.sender_image) {
          const isValid = await checkImageExists(notification.sender_image);
          console.log(`Image URL validity check for ${notification.id}: ${notification.sender_image} -> ${isValid ? 'Valid' : 'Invalid'}`);
        }
      }
      
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
    const { content, related_id, type, sender_id, sender_username } = notification;
    
    // If sender_username is available directly from the API, use it
    if (sender_username && sender_id) {
      const restOfContent = content.replace(new RegExp(`^${sender_username}\\s+`), '').trim();
      return { username: sender_username, userId: sender_id, restOfContent };
    }
    
    // Fallback to parsing the content
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
    } else if (userInfo.username) {
      // Fallback to search by username
      navigate(`/members?search=${encodeURIComponent(userInfo.username)}`);
    } else {
      // If somehow we don't have either, show a notification
      setError('Could not find user profile information');
    }
  };

  // Get default profile image
  const getDefaultProfileImage = () => {
    return '/default-profile.jpg'; // Use a local default image from public folder
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

  // Check if an image URL exists and is valid
  const checkImageExists = async (url: string): Promise<boolean> => {
    // Skip check for URLs that are already valid or invalid
    if (validImageUrls[url] !== undefined) {
      return validImageUrls[url];
    }
    
    // Skip check for empty URLs or relative URLs (those are assumed to be valid)
    if (!url || url.startsWith('/')) {
      return true;
    }
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const isValid = response.ok;
      setValidImageUrls(prev => ({ ...prev, [url]: isValid }));
      return isValid;
    } catch (err: unknown) {
      console.error('Error checking image URL:', url, err);
      setValidImageUrls(prev => ({ ...prev, [url]: false }));
      return false;
    }
  };

  // Get profile image source with validation
  const getProfileImageSrc = (notification: Notification): string => {
    // Prioritize current_sender_image (fresh from the DB) over sender_image (stored at notification creation)
    const currentImg = notification.current_sender_image;
    const storedImg = notification.sender_image;
    const imgUrl = currentImg || storedImg;
    
    console.log(`Notification #${notification.id} image sources:`, {
      current_sender_image: currentImg,
      sender_image: storedImg,
      selected: imgUrl,
      sender_id: notification.sender_id,
      sender_username: notification.sender_username
    });
    
    // If we've already verified this URL is invalid, use default immediately
    if (imgUrl && validImageUrls[imgUrl] === false) {
      console.log(`Using default image for notification #${notification.id} (cached invalid URL)`);
      return getDefaultProfileImage();
    }
    
    // Otherwise use the sender_image or default as fallback
    if (!imgUrl) {
      console.log(`Using default image for notification #${notification.id} (no image URL provided)`);
      return getDefaultProfileImage();
    }
    
    console.log(`Using image URL for notification #${notification.id}: ${imgUrl}`);
    return imgUrl;
  };

  // Handle filter change
  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
  };

  // Get notification count by type
  const getNotificationCountByType = (type: string): number => {
    if (type === 'all') {
      return notifications.length;
    }
    return notifications.filter(n => n.type === type).length;
  };

  // Get unread notification count
  const getUnreadCount = (): number => {
    return notifications.filter(n => !n.is_read).length;
  };

  // Toggle unread filter
  const toggleUnreadFilter = () => {
    setShowUnreadOnly(prev => !prev);
  };

  // Toggle filter dropdown
  const toggleFilterDropdown = () => {
    setShowFilterDropdown(prev => !prev);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm mb-6 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🔔</span> Notifications
                {getUnreadCount() > 0 && (
                  <span className="bg-red-100 text-red-800 text-sm px-2.5 py-0.5 rounded-full ml-2 animate-pulse">
                    {getUnreadCount()} new
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">Stay updated with your activities and interactions</p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Advanced Filter Button */}
              <div className="relative">
                <button
                  onClick={toggleFilterDropdown}
                  className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                  title="Advanced filters"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {showUnreadOnly && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                      Unread
                    </span>
                  )}
                </button>

                {/* Filter Dropdown */}
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-10 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium text-gray-800">Filter options</p>
                    </div>
                    <div className="px-4 py-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={showUnreadOnly} 
                          onChange={toggleUnreadFilter}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-700">Show unread only</span>
                      </label>
                    </div>
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-100">
                        <button
                          onClick={() => {
                            handleMarkAllAsRead();
                            toggleFilterDropdown();
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchNotifications()}
                className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors p-2 rounded-lg"
                title="Refresh notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Mark All as Read Button */}
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium hidden md:flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mark all as read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notification Status Summary */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm mb-6 p-4 flex justify-between items-center text-sm">
            <div className="text-gray-600">
              {filteredNotifications.length === 1 
                ? '1 notification' 
                : `${filteredNotifications.length} notifications`}
              {showUnreadOnly && ' (unread only)'}
            </div>
            <div className="flex items-center">
              <span className="mr-2 text-gray-600">Unread:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                {getUnreadCount()}
              </span>
            </div>
          </div>
        )}

        {/* Notification Filters */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide">
            {notificationTypes.map((type) => {
              const count = getNotificationCountByType(type.id);
              return (
                <button
                  key={type.id}
                  onClick={() => handleFilterChange(type.id)}
                  className={`flex items-center px-5 py-4 whitespace-nowrap transition-all duration-200 border-b-2 relative ${
                    activeFilter === type.id 
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50' 
                      : 'border-transparent hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-2 text-lg">{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                  {count > 0 && (
                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      activeFilter === type.id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {count}
                    </span>
                  )}
                  {activeFilter === type.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 animate-fadeIn"></span>
                  )}
                </button>
              );
            })}
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
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">
              {activeFilter === 'all' ? '📭' : notificationTypes.find(t => t.id === activeFilter)?.icon || '📭'}
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {activeFilter === 'all' 
                ? (showUnreadOnly ? 'No unread notifications' : 'No notifications yet')
                : `No ${notificationTypes.find(t => t.id === activeFilter)?.label.toLowerCase() || 'notifications'}`}
            </h2>
            <p className="text-gray-500">
              {activeFilter === 'all'
                ? (showUnreadOnly 
                    ? 'You have read all your notifications.'
                    : 'You don\'t have any notifications at the moment. Check back later for updates!')
                : `You don't have any ${notificationTypes.find(t => t.id === activeFilter)?.label.toLowerCase() || 'notifications'} at the moment.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
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
                                src={getProfileImageSrc(notification)} 
                                alt={userInfo.username}
                                className="w-8 h-8 rounded-full mr-2 object-cover cursor-pointer hover:ring-2 hover:ring-primary"
                                onClick={() => navigateToUserProfile(userInfo)}
                                title={`View ${userInfo.username}'s profile`}
                                onError={(e) => {
                                  // If the image fails to load, fallback to default image
                                  (e.target as HTMLImageElement).src = getDefaultProfileImage();
                                }}
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