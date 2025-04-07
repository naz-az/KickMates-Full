import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { getUnreadCount } from '../services/api';
import { AuthContext } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  refreshCount: () => Promise<void>;
  decrementCount: (count?: number) => void;
  incrementCount: (count?: number) => void;
}

export const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshCount: async () => {},
  decrementCount: () => {},
  incrementCount: () => {},
});

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useContext(AuthContext);

  // Fetch notification count on mount and every minute, but only if authenticated
  useEffect(() => {
    // Only set up notifications if the user is logged in
    if (isAuthenticated()) {
      refreshCount();
      
      // Set up an interval to periodically check for new notifications
      const intervalId = setInterval(refreshCount, 60000); // every minute
      
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated]);

  // Function to refresh the notification count
  const refreshCount = async () => {
    try {
      // Only fetch notifications if user is authenticated
      if (isAuthenticated()) {
        const response = await getUnreadCount();
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };

  // Decrement the notification count (when marking notifications as read)
  const decrementCount = (count: number = 1) => {
    setUnreadCount(prev => Math.max(0, prev - count));
  };

  // Increment the notification count (when new notifications arrive)
  const incrementCount = (count: number = 1) => {
    setUnreadCount(prev => prev + count);
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        unreadCount, 
        refreshCount, 
        decrementCount, 
        incrementCount 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}; 