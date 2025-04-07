import React, { useState, useEffect, useContext } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { AuthContext } from '../context/AuthContext';
import { getConversations } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList, MessagesStackParamList } from '../navigation/AppNavigator';
import { navigateToUserProfile } from '../utils/navigation';

interface Conversation {
  id: number;
  user_id: number;
  recipient_id: number;
  username: string;
  full_name: string;
  profile_image?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  event_id?: number;
  event_title?: string;
}

const MessagesScreen = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  
  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getConversations();
      setConversations(response.data.conversations);
      setFilteredConversations(response.data.conversations);
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
          id: item.id,
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
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientText}
        >
          <Text style={styles.headerTitle}>Messages</Text>
        </LinearGradient>
        <Text style={styles.headerSubtitle}>Chat with event creators and participants</Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
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
  conversationsList: {
    padding: 16,
  },
  conversationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  messagePreview: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  messageTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  eventTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default MessagesScreen; 