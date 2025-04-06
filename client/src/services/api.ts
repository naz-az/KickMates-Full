import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_URL = 'http://localhost:5001/api';

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
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.log('Authentication error:', error.response.data.message);
      
      // If there's a token but we got 401, the token might be invalid or expired
      const token = localStorage.getItem('token');
      if (token) {
        // Clear the invalid token
        localStorage.removeItem('token');
        
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/login')) {
          // Store the current location to redirect back after login
          sessionStorage.setItem('redirectPath', window.location.pathname);
          window.location.href = '/login';
        }
      }
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

export const uploadProfileImage = (file: File): Promise<AxiosResponse<{ user: User }>> => {
  const formData = new FormData();
  formData.append('profileImage', file);
  
  return api.post('/users/profile/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const uploadEventImage = (eventId: string | number, file: File): Promise<AxiosResponse<{ event: any }>> => {
  const formData = new FormData();
  formData.append('eventImage', file);
  
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

export const deleteAccount = (data: {
  password: string;
}): Promise<AxiosResponse<{ message: string }>> => {
  return api.post('/users/delete-account', data);
};

// Events API
export const getEvents = (params?: Record<string, string | number | boolean>): Promise<AxiosResponse<any>> => {
  return api.get('/events', { params });
};

export const getEventById = (id: string) => {
  console.log("API call: getEventById for ID:", id);
  const token = localStorage.getItem('token');
  console.log(`API call: Using token: ${token ? 'Present' : 'Missing'}`);
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
  return api.put(`/events/${id}`, eventData);
};

export const deleteEvent = (id: string) => {
  return api.delete(`/events/${id}`);
};

export const joinEvent = (id: string) => {
  return api.post(`/events/${id}/join`);
};

export const leaveEvent = (id: string) => {
  return api.delete(`/events/${id}/leave`);
};

export const bookmarkEvent = (id: string) => {
  return api.post(`/events/${id}/bookmark`);
};

export const addComment = (id: string, content: string, parentCommentId?: number) => {
  return api.post(`/events/${id}/comments`, { content, parentCommentId });
};

export const deleteComment = (id: string, commentId: string) => {
  return api.delete(`/events/${id}/comments/${commentId}`);
};

export const voteComment = (id: string, commentId: string, voteType: 'up' | 'down') => {
  return api.post(`/events/${id}/comments/${commentId}/vote`, { voteType });
};

export const getUserEvents = () => {
  return api.get('/users/events');
};

export const getUserBookmarks = () => {
  return api.get('/users/bookmarks');
};

// Get a specific user's profile
export const getUserById = (id: string | number) => {
  return api.get(`/users/${id}`);
};

// Get a specific user's events
export const getUserEventsById = (id: string | number) => {
  return api.get(`/users/${id}/events`);
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

export const sendMessage = (conversationId: string | number, content: string, replyToId?: number | null) => {
  return api.post(`/messages/conversations/${conversationId}/messages`, { 
    content,
    replyToId: replyToId || null
  });
};

export const likeMessage = (conversationId: string | number, messageId: number) => {
  return api.post(`/messages/conversations/${conversationId}/messages/${messageId}/like`);
};

export const unlikeMessage = (conversationId: string | number, messageId: number) => {
  return api.delete(`/messages/conversations/${conversationId}/messages/${messageId}/like`);
};

export const deleteMessage = (conversationId: string | number, messageId: number) => {
  return api.delete(`/messages/conversations/${conversationId}/messages/${messageId}`);
};

export const createConversation = (participantIds: number[]) => {
  return api.post('/messages/conversations', { participantIds });
};

// Discussions API
export const getDiscussions = (params?: Record<string, string | number | boolean>): Promise<AxiosResponse<any>> => {
  return api.get('/discussions', { params });
};

export const getDiscussionById = (id: string): Promise<AxiosResponse<any>> => {
  return api.get(`/discussions/${id}`);
};

export const createDiscussion = (discussionData: {
  title: string;
  content: string;
  category: string;
  image_url?: string;
}): Promise<AxiosResponse<any>> => {
  return api.post('/discussions', discussionData);
};

export const updateDiscussion = (id: string, discussionData: Record<string, unknown>): Promise<AxiosResponse<any>> => {
  return api.put(`/discussions/${id}`, discussionData);
};

export const deleteDiscussion = (id: string): Promise<AxiosResponse<any>> => {
  return api.delete(`/discussions/${id}`);
};

export const voteDiscussion = (id: string, voteType: 'up' | 'down'): Promise<AxiosResponse<any>> => {
  return api.post(`/discussions/${id}/vote`, { voteType });
};

export const addDiscussionComment = (id: string, content: string, parentCommentId?: number): Promise<AxiosResponse<any>> => {
  return api.post(`/discussions/${id}/comments`, { content, parentCommentId });
};

export const deleteDiscussionComment = (discussionId: string, commentId: string): Promise<AxiosResponse<any>> => {
  return api.delete(`/discussions/${discussionId}/comments/${commentId}`);
};

export const voteDiscussionComment = (discussionId: string, commentId: string, voteType: 'up' | 'down'): Promise<AxiosResponse<any>> => {
  return api.post(`/discussions/${discussionId}/comments/${commentId}/vote`, { voteType });
};

export const uploadDiscussionImage = (discussionId: string | number, file: File): Promise<AxiosResponse<{ discussion: any }>> => {
  const formData = new FormData();
  formData.append('discussionImage', file);
  
  return api.post(`/discussions/${discussionId}/upload-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export default api;