import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { AuthContext } from '../context/AuthContext';
import { getConversations, searchUsers } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList, MessagesStackParamList } from '../navigation/AppNavigator';
import { navigateToUserProfile } from '../utils/navigation';

interface Conversation {
  id: number;
  participants: Array<{
    id: number;
    username: string;
    full_name: string;
    profile_image?: string;
  }>;
  lastMessage: {
    id: number;
    senderId: number;
    senderUsername: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    fullDate: string;
    displayTime: string;
  } | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  username: string;
  full_name: string;
  profile_image?: string;
  email: string;
}

const MessagesScreen = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  const navigation = useNavigation();
  const profileNavigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user: currentUser } = useContext(AuthContext);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      // @ts-ignore - Ignoring type error for this navigation
      navigation.replace('Login');
    } else {
      fetchConversations();
    }
  }, [currentUser, navigation]);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = conversations.filter(
        (conversation) =>
          conversation.username.toLowerCase().includes(query) ||
          conversation.full_name.toLowerCase().includes(query) ||
          (conversation.event_title && conversation.event_title.toLowerCase().includes(query)) ||
          conversation.last_message.toLowerCase().includes(query)
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);
  
  useEffect(() => {
    if (searchQuery.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSearching(true);
          const response = await searchUsers(searchQuery);
          setSearchResults(response.data.users);
        } catch (err) {
          console.error('Error searching users:', err);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);
  
  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getConversations();
      const conversations = response.data.conversations.map((conv: Conversation) => {
        // Get the other participant (not the current user)
        const otherParticipant = conv.participants[0];
        return {
          id: conv.id,
          recipient_id: otherParticipant.id,
          username: otherParticipant.username,
          full_name: otherParticipant.full_name,
          profile_image: otherParticipant.profile_image,
          last_message: conv.lastMessage?.content || '',
          last_message_time: conv.lastMessage?.createdAt || conv.updatedAt,
          unread_count: conv.unreadCount,
          event_id: undefined,
          event_title: undefined
        };
      });
      
      setConversations(conversations);
      setFilteredConversations(conversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load messages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };
  
  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // If today, return time only
      if (date.toDateString() === now.toDateString()) {
        return format(date, 'h:mm a');
      }
      
      // If this year, return month and day
      if (date.getFullYear() === now.getFullYear()) {
        return format(date, 'MMM d');
      }
      
      // Otherwise, return month, day and year
      return format(date, 'MMM d, yyyy');
    } catch (err) {
      return dateString;
    }
  };
  
  const handleUserProfilePress = (userId: number) => {
    navigateToUserProfile(navigation, userId, currentUser?.id);
  };
  
  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      style={styles.conversationCard}
      onPress={() => {
        // @ts-ignore - Ignoring type error for this navigation
        navigation.navigate('Conversation', { 
          conversationId: item.id,
          recipientId: item.recipient_id,
          recipientName: item.full_name,
          recipientImage: item.profile_image,
          eventId: item.event_id,
          eventTitle: item.event_title
        });
      }}
    >
      <View style={styles.conversationLeft}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => handleUserProfilePress(item.recipient_id)}
        >
          <Image 
            source={item.profile_image ? { uri: item.profile_image } : require('../assets/images/default-avatar.png')} 
            style={styles.userAvatar} 
          />
          {item.unread_count > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{item.unread_count}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.messagePreview}>
          <View style={styles.conversationHeader}>
            <TouchableOpacity onPress={() => handleUserProfilePress(item.recipient_id)}>
              <Text style={styles.userName}>{item.full_name}</Text>
            </TouchableOpacity>
            <Text style={styles.messageTime}>{formatMessageTime(item.last_message_time)}</Text>
          </View>
          
          {item.event_title && (
            <View style={styles.eventTag}>
              <Ionicons name="calendar-outline" size={12} color="#4F46E5" />
              <Text style={styles.eventTitle} numberOfLines={1}>{item.event_title}</Text>
            </View>
          )}
          
          <Text 
            style={[styles.lastMessage, item.unread_count > 0 && styles.unreadMessage]} 
            numberOfLines={1}
          >
            {item.last_message}
          </Text>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
  
  const renderSearchResults = () => {
    if (!searchQuery || searchQuery.length <= 2) return null;

    return (
      <View style={styles.searchResultsContainer}>
        {isSearching ? (
          <View style={styles.searchLoading}>
            <ActivityIndicator size="small" color="#4F46E5" />
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => {
                  navigation.navigate('CreateMessage', {
                    initialRecipient: item
                  });
                }}
              >
                <Image
                  source={item.profile_image ? { uri: item.profile_image } : require('../assets/images/default-avatar.png')}
                  style={styles.searchResultAvatar}
                />
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultName}>{item.full_name}</Text>
                  <Text style={styles.searchResultUsername}>@{item.username}</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.searchResultsList}
          />
        ) : (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No users found</Text>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity 
          style={styles.navbarButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.navbarTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.navbarButton}
          onPress={() => navigation.navigate('CreateMessage')}
        >
          <Ionicons name="create-outline" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* <Text style={styles.headerSubtitle}>Chat with event creators and participants</Text> */}
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages or users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {renderSearchResults()}

        {/* Conversations List */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchConversations}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.conversationsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No conversations yet</Text>
                {searchQuery.length > 0 ? (
                  <Text style={styles.emptySubtext}>Try a different search term</Text>
                ) : (
                  <Text style={styles.emptySubtext}>Join or create events to start chats with other members</Text>
                )}
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navbarButton: {
    padding: 8,
  },
  navbarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  searchContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  conversationsList: {
    padding: 16,
  },
  conversationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  conversationLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagePreview: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  messageTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  eventTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  eventTitle: {
    fontSize: 12,
    color: '#4F46E5',
    marginLeft: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  unreadMessage: {
    color: '#111827',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
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
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  gradientText: {
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 180 : 150,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    maxHeight: 300,
    zIndex: 1000,
  },
  searchResultsList: {
    padding: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  searchResultUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  searchLoading: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default MessagesScreen; 