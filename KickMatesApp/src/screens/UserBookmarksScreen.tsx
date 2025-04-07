import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { getUserBookmarks, bookmarkEvent } from '../services/api';
import EventCard from '../components/EventCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useToast } from '../context/ToastContext';

interface BookmarkedEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  sport_type: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  creator_id: number;
  max_players: number;
  current_players: number;
  creator_name: string;
  creator_profile_image?: string;
  bookmarked_by_user?: boolean;
}

const UserBookmarksScreen = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const isRemovingBookmarkRef = useRef<Record<number, boolean>>({});
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigation.replace('Login');
    } else {
      fetchBookmarks();
    }
  }, [user, navigation]);
  
  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getUserBookmarks();
      console.log('[DEBUG] Bookmarks response:', response.data);
      
      // The server returns data as { bookmarkedEvents } but we were accessing it as .bookmarks
      if (response.data.bookmarkedEvents) {
        setBookmarks(response.data.bookmarkedEvents);
      } else {
        console.error('[DEBUG] Unexpected bookmarks response format:', response.data);
        setBookmarks([]);
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      setError('Failed to load bookmarks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookmarks();
    setRefreshing(false);
  };
  
  const navigateToEventDetail = (eventId: number | string) => {
    navigation.navigate('EventDetail', { id: eventId.toString() });
  };
  
  const handleRemoveBookmark = async (eventId: number) => {
    // Prevent multiple rapid clicks on the same bookmark
    if (isRemovingBookmarkRef.current[eventId]) {
      console.log(`[UserBookmarks] Already removing bookmark ${eventId}, ignoring click`);
      return;
    }
    
    try {
      // Mark this bookmark as being removed
      isRemovingBookmarkRef.current[eventId] = true;
      
      // Optimistically update UI
      const updatedEvents = bookmarks.filter(event => event.id !== eventId);
      setBookmarks(updatedEvents);
      
      // Add a small delay to debounce multiple clicks
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Call API with string parameter as required
      await bookmarkEvent(eventId.toString());
      
      // Show toast
      showToast('Event removed from bookmarks', 'success');
    } catch (error) {
      console.error('Error removing bookmark:', error);
      
      // Revert on error
      fetchBookmarks();
      
      // Show error toast
      showToast('Failed to remove bookmark. Please try again.', 'error');
    } finally {
      // Reset after a delay to prevent immediate re-clicks
      setTimeout(() => {
        const updatedRef = { ...isRemovingBookmarkRef.current };
        delete updatedRef[eventId];
        isRemovingBookmarkRef.current = updatedRef;
      }, 500);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientText}
          >
            <Text style={styles.headerTitle}>My Bookmarks</Text>
          </LinearGradient>
          <Text style={styles.headerSubtitle}>Events you've saved for later</Text>
        </View>
      </View>
      
      {/* Bookmarks List */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBookmarks}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          renderItem={({ item }) => (
            <EventCard 
              event={{ 
                ...item,
                bookmarked_by_user: true // All events here are bookmarked
              }} 
              index={bookmarks.indexOf(item)}
              onPress={() => navigateToEventDetail(item.id)}
              onBookmarkPress={() => handleRemoveBookmark(item.id)}
              showBookmarkButton
            />
          )}
          keyExtractor={(item) => `bookmark-${item.id}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No bookmarks yet</Text>
              <Text style={styles.emptyStateText}>
                Events you bookmark will appear here
              </Text>
            </View>
          }
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  gradientText: {
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 8,
  },
  retryButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
});

export default UserBookmarksScreen; 