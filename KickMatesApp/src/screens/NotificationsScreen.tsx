import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../services/api';
import { format, formatDistanceToNow } from 'date-fns';
import Button from '../components/Button';

interface Notification {
  id: number;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
  target_id?: number;
  target_type?: string;
}

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigation = useNavigation();
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getNotifications();
      setNotifications(response.data.notifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      // Update local state to mark all as read
      setNotifications(notifications.map(notification => ({ ...notification, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark notifications as read. Please try again.');
    }
  };
  
  const handleNotificationPress = async (notification: Notification) => {
    try {
      if (!notification.is_read) {
        // Mark as read in the backend
        await markNotificationAsRead(notification.id.toString());
        
        // Update local state
        setNotifications(notifications.map(item => 
          item.id === notification.id ? { ...item, is_read: true } : item
        ));
      }
      
      // Navigate based on notification type
      if (notification.target_type === 'event' && notification.target_id) {
        // @ts-ignore - Navigation typing is complex here
        navigation.navigate('EventsTab', {
          screen: 'EventDetail',
          params: { id: notification.target_id.toString() }
        });
      } else if (notification.target_type === 'discussion' && notification.target_id) {
        // @ts-ignore - Navigation typing is complex here
        navigation.navigate('DiscussionsTab', {
          screen: 'DiscussionDetail',
          params: { id: notification.target_id.toString() }
        });
      } else if (notification.target_type === 'message' && notification.target_id) {
        // @ts-ignore - Navigation typing is complex here
        navigation.navigate('MessagesTab', {
          screen: 'Conversation',
          params: { id: notification.target_id.toString() }
        });
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };
  
  const handleDeleteNotification = async (id: number) => {
    try {
      await deleteNotification(id.toString());
      // Remove from local state
      setNotifications(notifications.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification. Please try again.');
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_invite':
      case 'event_reminder':
      case 'event_update':
        return <Ionicons name="calendar" size={24} color="#4F46E5" />;
      case 'event_joined':
      case 'event_left':
        return <Ionicons name="people" size={24} color="#10B981" />;
      case 'message':
        return <Ionicons name="mail" size={24} color="#EC4899" />;
      case 'discussion_mention':
      case 'comment_reply':
        return <Ionicons name="chatbubbles" size={24} color="#8B5CF6" />;
      default:
        return <Ionicons name="notifications" size={24} color="#6B7280" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    } else if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };
  
  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        {getNotificationIcon(item.type)}
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>{item.content}</Text>
        <Text style={styles.notificationTime}>{formatDate(item.created_at)}</Text>
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteNotification(item.id)}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Ionicons name="close" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>You don't have any notifications yet.</Text>
    </View>
  );
  
  const renderHeader = () => {
    const unreadCount = notifications.filter(item => !item.is_read).length;
    
    if (unreadCount === 0 || notifications.length === 0) {
      return null;
    }
    
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.unreadCountText}>{unreadCount} unread notifications</Text>
        <Button
          title="Mark All as Read"
          variant="outline"
          onPress={handleMarkAllAsRead}
          style={styles.markReadButton}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={fetchNotifications}
            variant="outline"
            style={styles.retryButton}
          />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.notificationsList}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  unreadCountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
  },
  markReadButton: {
    height: 36,
    paddingHorizontal: 12,
  },
  notificationsList: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  unreadItem: {
    backgroundColor: '#EEF2FF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  deleteButton: {
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#B91C1C',
    marginVertical: 16,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default NotificationsScreen; 