import React, { useState, useEffect, useContext } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { getUserEvents } from '../services/api';
import EventCard from '../components/EventCard';
import { LinearGradient } from 'expo-linear-gradient';

interface RouteParams {
  userId?: number;
  isCreatedEvents?: boolean;
}

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  event_date: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  creator_id: number;
  category: string;
  capacity: number;
  current_participants: number;
  status: string;
  creator_name: string;
  creator_profile_image?: string;
  is_bookmarked: boolean;
  is_joined: boolean;
}

const UserEventsScreen = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { user } = useContext(AuthContext);
  
  const userId = route.params?.userId || user?.id;
  const initialTab = route.params?.isCreatedEvents ? 'created' : 'joined';
  
  // Set initial tab from route params if provided
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Redirect to login if not authenticated and no userId provided
  useEffect(() => {
    if (!user && !userId) {
      navigation.replace('Login');
    } else {
      fetchEvents();
    }
  }, [user, userId, navigation, activeTab]);
  
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getUserEvents({
        userId: userId,
        type: activeTab === 'created' ? 'created' : 'joined'
      });
      
      setEvents(response.data.events);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };
  
  const navigateToEventDetail = (eventId) => {
    navigation.navigate('EventDetail', { id: eventId });
  };
  
  const toggleTab = (tab: 'created' | 'joined') => {
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  };
  
  const isOwnProfile = userId === user?.id;
  
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
            <Text style={styles.headerTitle}>
              {isOwnProfile ? 'My Events' : 'User Events'}
            </Text>
          </LinearGradient>
          <Text style={styles.headerSubtitle}>
            {isOwnProfile ? 
              'Events youve created or joined' : 
              'Events this user has created or joined'
            }
          </Text>
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'created' && styles.activeTab]}
          onPress={() => toggleTab('created')}
        >
          <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>
            Created
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
          onPress={() => toggleTab('joined')}
        >
          <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>
            Joined
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Events List */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={({ item }) => (
            <EventCard 
              event={{
                id: item.id,
                title: item.title,
                sport_type: item.category,
                location: item.location,
                start_date: item.event_date,
                end_date: item.event_date,
                current_players: item.current_participants,
                max_players: item.capacity,
                image_url: item.image_url,
                creator: {
                  name: item.creator_name,
                  profile_image: item.creator_profile_image
                }
              }}
              onPress={() => navigateToEventDetail(item.id)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>
                {activeTab === 'created' 
                  ? (isOwnProfile ? 'You haven\'t created any events yet' : 'This user hasn\'t created any events yet') 
                  : (isOwnProfile ? 'You haven\'t joined any events yet' : 'This user hasn\'t joined any events yet')
                }
              </Text>
              {isOwnProfile && (
                <>
                  <Text style={styles.emptySubtext}>
                    {activeTab === 'created' 
                      ? 'Create your first event and connect with others'
                      : 'Join events to find teammates and play together'
                    }
                  </Text>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => 
                      activeTab === 'created' 
                        ? navigation.navigate('CreateEvent')
                        : navigation.navigate('Events')
                    }
                  >
                    <Text style={styles.actionButtonText}>
                      {activeTab === 'created' ? 'Create Event' : 'Browse Events'}
                    </Text>
                  </TouchableOpacity>
                </>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: 'bold',
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
  eventsList: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default UserEventsScreen; 