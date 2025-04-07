import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Choose API URL based on platform
// For development, we'll use the built-in development server
let API_URL = '';
if (Platform.OS === 'web') {
  API_URL = 'http://localhost:5001/api'; // Use the actual server port
} else if (Platform.OS === 'ios') {
  API_URL = 'http://localhost:5001/api';
} else {
  API_URL = 'http://192.168.0.101:5001/api'; // Match the actual server port
}

console.log(`[API] Service configured with URL: ${API_URL}`);

interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  bio?: string;
  profile_image?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface NotificationCountResponse {
  count: number;
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to add auth token to requests
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API] Error response from ${error.config?.url}:`, {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error('[API] No response received:', error.request);
    } else {
      console.error('[API] Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const login = (identifier: string, password: string): Promise<AxiosResponse<AuthResponse>> => {
  return api.post('/users/login', { email: identifier, password });
};

export const register = (userData: {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  bio?: string;
}): Promise<AxiosResponse<AuthResponse>> => {
  return api.post('/users/register', userData);
};

export const getProfile = (): Promise<AxiosResponse<{ user: User }>> => {
  return api.get('/users/profile');
};

export const updateProfile = (userData: {
  full_name?: string;
  bio?: string;
  profile_image?: string;
}): Promise<AxiosResponse<{ user: User }>> => {
  return api.put('/users/profile', userData);
};

export const uploadProfileImage = (imageUri: string): Promise<AxiosResponse<{ user: User }>> => {
  const formData = new FormData();
  
  // Extract filename from uri
  const uriParts = imageUri.split('/');
  const filename = uriParts[uriParts.length - 1];
  
  // @ts-ignore - FormData append typings don't match exactly what we need for React Native
  formData.append('profileImage', {
    uri: imageUri,
    name: filename,
    type: 'image/jpeg', // Adjust based on your actual image type
  });
  
  return api.post('/users/profile/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const uploadEventImage = (eventId: string | number, imageUri: string): Promise<AxiosResponse<{ event: any }>> => {
  const formData = new FormData();
  
  // Extract filename from uri
  const uriParts = imageUri.split('/');
  const filename = uriParts[uriParts.length - 1];
  
  // @ts-ignore - FormData append typings don't match exactly what we need for React Native
  formData.append('eventImage', {
    uri: imageUri,
    name: filename,
    type: 'image/jpeg', // Adjust based on your actual image type
  });
  
  return api.post(`/events/${eventId}/upload-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const changePassword = (passwords: {
  currentPassword: string;
  newPassword: string;
}): Promise<AxiosResponse<{ message: string }>> => {
  return api.post('/users/change-password', passwords);
};

// Events API
export const getEvents = (params?: Record<string, string | number | boolean>): Promise<AxiosResponse<any>> => {
  return api.get('/events', { params });
};

export const getEventById = (id: string) => {
  return api.get(`/events/${id}`);
};

export const createEvent = (eventData: {
  title: string;
  description?: string;
  sport_type: string;
  location: string;
  start_date: string;
  end_date: string;
  max_players: number;
  image_url?: string;
}) => {
  return api.post('/events', eventData);
};

export const updateEvent = (id: string, eventData: Record<string, unknown>): Promise<AxiosResponse<any>> => {
  console.log(`[API] Attempting to update event with ID: ${id}`, { eventData });
  return api.put(`/events/${id}`, eventData)
    .catch(error => {
      if (error.response) {
        const { status, data } = error.response;
        console.error(`[API] Error (${status}) updating event:`, data);
        
        if (status === 403) {
          throw new Error('You do not have permission to update this event. Only the creator can update events.');
        } else if (status === 404) {
          throw new Error('Event not found. It may have been deleted.');
        } else if (status === 400) {
          throw new Error(`Invalid event data: ${data.message || 'Please check your inputs.'}`);
        } else {
          throw new Error(`Server error: ${data.message || 'Unknown error occurred.'}`);
        }
      }
      console.error('[API] Network or other error updating event:', error);
      throw error;
    });
};

export const deleteEvent = (id: string) => {
  return api.delete(`/events/${id}`);
};

export const joinEvent = (id: string) => {
  // Match the web version which doesn't send a body
  console.log(`[API] Attempting to join event with ID: ${id} (type: ${typeof id})`);
  return api.post(`/events/${id}/join`);
};

export const leaveEvent = (id: string) => {
  return api.delete(`/events/${id}/leave`);
};

export const bookmarkEvent = (id: string) => {
  // Match the web version which doesn't send a body
  return api.post(`/events/${id}/bookmark`);
};

export const addComment = (id: string, content: string, parentCommentId?: number) => {
  return api.post(`/events/${id}/comments`, { content, parentCommentId });
};

export const deleteComment = (id: string, commentId: string) => {
  console.log(`[API DEBUG] deleteComment called with params:`, {
    eventId: id,
    commentId: commentId,
    eventIdType: typeof id,
    commentIdType: typeof commentId,
    url: `${API_URL}/events/${id}/comments/${commentId}`
  });
  
  // Make a test GET request first to check if the endpoint is valid
  console.log(`[API DEBUG] Checking if comment exists before delete: GET ${API_URL}/events/${id}`);
  
  return api.delete(`/events/${id}/comments/${commentId}`)
    .then(response => {
      console.log(`[API DEBUG] Successfully deleted comment. Response:`, response.status, response.data);
      return response;
    })
    .catch(error => {
      console.error(`[API DEBUG] Error deleting comment:`, { 
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: error.config
      });
      throw error;
    });
};

export const voteComment = (id: string, commentId: string, voteType: 'up' | 'down') => {
  return api.post(`/events/${id}/comments/${commentId}/vote`, { voteType });
};

export const getUserEvents = (p0: { userId: number | undefined; type: string; }) => {
  return api.get('/users/events');
};

export const getUserBookmarks = () => {
  return api.get('/users/bookmarks');
};

// Get a specific user's profile
export const getUserById = (userId: string) => {
  return api.get(`/users/${userId}`);
};

// Get a specific user's events
export const getUserEventsById = (userId: string) => {
  return api.get(`/users/${userId}/events`);
};

// Discussions API
export const getDiscussions = (params?: Record<string, string | number | boolean>) => {
  return api.get('/discussions', { params });
};

export const getDiscussionById = (id: string) => {
  return api.get(`/discussions/${id}`);
};

export const createDiscussion = (discussionData: FormData | {
  title: string;
  content: string;
  category?: string;
  topic?: string;
}) => {
  // Check if we're dealing with FormData (for image uploads)
  const isFormData = discussionData instanceof FormData;
  
  return api.post('/discussions', discussionData, {
    headers: isFormData ? {
      'Content-Type': 'multipart/form-data'
    } : undefined
  });
};

export const updateDiscussion = (id: string, discussionData: Record<string, unknown>) => {
  return api.put(`/discussions/${id}`, discussionData);
};

export const deleteDiscussion = (id: string) => {
  return api.delete(`/discussions/${id}`);
};

export const addDiscussionComment = (id: string, content: string, parentCommentId?: number) => {
  return api.post(`/discussions/${id}/comments`, { content, parentCommentId });
};

export const deleteDiscussionComment = (id: string, commentId: string) => {
  return api.delete(`/discussions/${id}/comments/${commentId}`);
};

export const voteDiscussionComment = (id: string, commentId: string, voteType: 'up' | 'down') => {
  return api.post(`/discussions/${id}/comments/${commentId}/vote`, { voteType });
};

export const voteDiscussion = (id: string, voteType: 'up' | 'down'): Promise<AxiosResponse<any>> => {
  return api.post(`/discussions/${id}/vote`, { voteType });
};

// Notifications API
export const getNotifications = () => {
  return api.get('/notifications');
};

export const getUnreadCount = (): Promise<AxiosResponse<NotificationCountResponse>> => {
  return api.get('/notifications/unread-count');
};

export const markNotificationAsRead = (id: string) => {
  return api.put(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = () => {
  return api.put('/notifications/read-all');
};

export const deleteNotification = (id: string) => {
  return api.delete(`/notifications/${id}`);
};

// Users API
export const getAllUsers = () => {
  return api.get('/users/all');
};

// Messages API
export const getConversations = () => {
  return api.get('/messages/conversations');
};

export const getConversation = (conversationId: string | number) => {
  return api.get(`/messages/conversations/${conversationId}`);
};

export const getMessages = (conversationId: string | number) => {
  return api.get(`/messages/conversations/${conversationId}/messages`);
};

// Send a message with optional reply
export const sendMessage = async (
  conversationId: string | number,
  content: string,
  replyToId?: number
) => {
  try {
    const response = await api.post(`/messages/conversations/${conversationId}/messages`, {
      content,
      replyToId
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Like a message
export const likeMessage = async (conversationId: string, messageId: string) => {
  try {
    const response = await api.post(`/messages/conversations/${conversationId}/messages/${messageId}/like`);
    return response.data;
  } catch (error) {
    console.error('Error liking message:', error);
    throw error;
  }
};

// Unlike a message
export const unlikeMessage = async (conversationId: string, messageId: string) => {
  try {
    const response = await api.delete(`/messages/conversations/${conversationId}/messages/${messageId}/like`);
    return response.data;
  } catch (error) {
    console.error('Error unliking message:', error);
    throw error;
  }
};

// Delete a message
export const deleteMessage = async (
  conversationId: string | number,
  messageId: string | number
) => {
  try {
    const response = await api.delete(`/messages/conversations/${conversationId}/messages/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

export const startConversation = (userId: number) => {
  return api.post('/messages/conversations', { userId });
};

export const markConversationAsRead = async (conversationId: number) => {
  try {
    console.log(`[API] Marking conversation ${conversationId} as read`);
    // NOTE: This endpoint (/messages/conversations/${conversationId}/read) doesn't exist on the backend yet
    // This function will fail with 404 errors until the backend implements this endpoint
    // It's temporarily disabled in the ConversationScreen.tsx file
    const response = await api.post(`/messages/conversations/${conversationId}/read`);
    return response.data;
  } catch (error) {
    console.error('[API] Error marking conversation as read:', error);
    throw error;
  }
};

// Search API
export const searchAll = (query: string) => {
  return api.get('/search', { params: { query } });
};

export const searchEvents = (query: string) => {
  return api.get('/search/events', { params: { query } });
};

export const searchUsers = async (query: string) => {
  const response = await api.get('/users/search', {
    params: { query },
    headers: { Authorization: `Bearer ${await getToken()}` }
  });
  return response;
};

export const searchDiscussions = (query: string) => {
  return api.get('/search/discussions', { params: { query } });
};

export const uploadDiscussionImage = (discussionId: string | number, imageUri: string): Promise<AxiosResponse<{ discussion: any }>> => {
  const formData = new FormData();
  
  // Extract filename from uri
  const uriParts = imageUri.split('/');
  const filename = uriParts[uriParts.length - 1];
  
  // @ts-ignore - FormData append typings don't match exactly what we need for React Native
  formData.append('discussionImage', {
    uri: imageUri,
    name: filename,
    type: 'image/jpeg', // Adjust based on your actual image type
  });
  
  return api.post(`/discussions/${discussionId}/upload-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// User settings API
export const getUserSettings = () => {
  // Server doesn't have dedicated settings endpoint, use profile instead
  return api.get('/users/profile').then(response => {
    // Construct default settings with user profile
    const defaultSettings = {
      pushNotifications: true,
      emailNotifications: true,
      eventReminders: true,
      messageNotifications: true,
      darkMode: false,
      privateProfile: false,
      showDistance: true,
      locationSharing: true,
      units: 'metric',
      ...response.data.user.settings // In case server adds settings in the future
    };
    
    return {
      data: {
        settings: defaultSettings
      }
    };
  });
};

export const updateUserSettings = (settings: Record<string, any>) => {
  // Server doesn't have dedicated settings endpoint, use profile instead
  // We'll mock this for now until server implements settings
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: { success: true } });
    }, 500);
  });
};

export const deleteAccount = () => {
  return api.post('/users/delete-account');
};

// Add this near the top of the file after the api instance creation
export const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Debugging function to call from any screen
export const debugApiToken = async () => {
  return getToken();
};

export const createConversation = async (data: {
  participantIds: number[];
  initialMessage: string;
}) => {
  const response = await api.post(
    '/conversations',
    data,
    { headers: { Authorization: `Bearer ${await getToken()}` } }
  );
  return response;
}; 