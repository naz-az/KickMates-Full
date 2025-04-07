import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Animated,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import theme from '../theme/theme';
import Button from '../components/Button';
import EventCard from '../components/EventCard';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { AuthContext } from '../context/AuthContext';
import { getUserById, getUserEventsById } from '../services/api';
import { ProfileStackParamList } from '../navigation/AppNavigator';

const SCREEN_WIDTH = Dimensions.get('window').width;

type UserProfileScreenRouteProp = RouteProp<ProfileStackParamList, 'UserProfile'>;
type UserProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface User {
  id: number;
  username: string;
  full_name: string;
  bio: string;
  profile_image?: string;
  created_at: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  sport_type: string;
  image_url?: string;
  max_players: number;
  current_players: number;
  creator_id: number;
  creator?: {
    id: number;
    username: string;
    profile_image?: string;
  };
}

const UserProfileScreen = () => {
  const navigation = useNavigation<UserProfileNavigationProp>();
  const route = useRoute<UserProfileScreenRouteProp>();
  const { user: currentUser } = useContext(AuthContext);
  const userId = route.params?.id;
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // State
  const [userData, setUserData] = useState<User | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('events');
  const [showAllEvents, setShowAllEvents] = useState(false);
  
  // Transform for header opacity based on scroll position
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    
    // If the user is trying to see their own profile, redirect to ProfileScreen
    if (currentUser?.id.toString() === userId) {
      navigation.replace('Profile');
      return;
    }
    
    // Load user data
    loadUserData();
  }, [userId, currentUser, navigation]);
  
  const loadUserData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch user profile data
      const userResponse = await getUserById(userId);
      setUserData(userResponse.data.user);
      
      // Fetch user events
      const eventsResponse = await getUserEventsById(userId);
      setUserEvents([
        ...eventsResponse.data.created,
        ...eventsResponse.data.participating
      ]);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user profile. Please try again.');
      setIsLoading(false);
    }
  };
  
  const toggleFollow = () => {
    // In a real implementation, we would call an API to follow/unfollow
    setIsFollowing(prev => !prev);
    
    // Show a temporary message until the follow API is implemented
    Alert.alert(
      isFollowing ? "Unfollowed" : "Following",
      isFollowing 
        ? `You are no longer following ${userData?.username}.` 
        : `You are now following ${userData?.username}.`
    );
  };
  
  const getMemberSince = () => {
    if (!userData?.created_at) return '';
    const date = new Date(userData.created_at);
    return `Member since ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  };

  const handleViewAllEvents = () => {
    setShowAllEvents(true);
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // All events view
  if (showAllEvents) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowAllEvents(false)}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Events</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {userEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          
          {userEvents.length === 0 && (
            <Card style={styles.emptyStateContainer} variant="outlined">
              <Ionicons name="calendar-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No Events</Text>
              <Text style={styles.emptyStateDescription}>
                This user hasn't created any events yet
              </Text>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
        <BlurView intensity={80} style={styles.blurView}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitleSmall}>{userData?.full_name || userData?.username}</Text>
            <View style={{ width: 40 }} />
          </View>
        </BlurView>
      </Animated.View>
      
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <Card
          style={styles.profileCard}
          variant="elevated"
          elevation="md"
        >
          <LinearGradient
            colors={theme.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCardHeader}
          />
          
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <Avatar 
                size={110}
                source={userData?.profile_image ? { uri: userData.profile_image } : null}
                name={userData?.full_name || userData?.username}
                gradient={!userData?.profile_image}
              />
            </View>
            
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>
                {userData?.full_name || userData?.username}
              </Text>
              
              <Text style={styles.userUsername}>@{userData?.username}</Text>
              
              <Badge 
                label={getMemberSince()} 
                variant="outline"
                icon="calendar-outline"
                style={styles.memberBadge}
              />
            </View>
            
            {userData?.bio ? (
              <Text style={styles.userBio}>{userData.bio}</Text>
            ) : null}
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userEvents.length || 0}</Text>
                <Text style={styles.statLabel}>Events</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text> {/* This would come from the API in a real implementation */}
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>
            
            <Button
              title={isFollowing ? "Following" : "Follow"}
              onPress={toggleFollow}
              icon={isFollowing ? 
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" /> : 
                <Ionicons name="person-add" size={18} color="#FFFFFF" />}
              style={styles.followButton}
              gradient={true}
              gradientColors={isFollowing ? theme.gradients.success : theme.gradients.primary}
            />
          </View>
        </Card>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Events by {userData?.full_name?.split(' ')[0] || userData?.username}</Text>
        </View>
        
        <View style={styles.eventsContainer}>
          {userEvents.length > 0 ? (
            <>
              {userEvents.slice(0, 3).map(event => (
                <EventCard key={event.id} event={event} />
              ))}
              
              {userEvents.length > 3 && (
                <Button
                  title="View All Events"
                  onPress={handleViewAllEvents}
                  icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
                  iconPosition="right"
                  style={styles.viewAllButton}
                  gradient={true}
                  gradientColors={theme.gradients.cool}
                />
              )}
            </>
          ) : (
            <Card style={styles.emptyStateContainer} variant="outlined">
              <Ionicons name="calendar-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No Events</Text>
              <Text style={styles.emptyStateDescription}>
                This user hasn't created any events yet
              </Text>
            </Card>
          )}
        </View>
      </Animated.ScrollView>
      
      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.goBack()}>
          <Ionicons name="home-outline" size={24} color="#6B7280" />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.goBack()}>
          <Ionicons name="calendar-outline" size={24} color="#6B7280" />
          <Text style={styles.tabLabel}>Events</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.goBack()}>
          <View style={styles.createTabButton}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.goBack()}>
          <Ionicons name="notifications-outline" size={24} color="#6B7280" />
          <Text style={styles.tabLabel}>Alerts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.goBack()}>
          <Ionicons name="person-outline" size={24} color="#6B7280" />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
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
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  blurView: {
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitleSmall: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  scrollContent: {
    paddingBottom: 80, // Add padding to account for bottom tab bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 45 : 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  backButton: {
    padding: 8,
  },
  profileCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileCardHeader: {
    height: 80,
  },
  profileContent: {
    padding: 16,
    alignItems: 'center',
    marginTop: -55,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  memberBadge: {
    marginBottom: 8,
  },
  userBio: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
    alignSelf: 'center',
  },
  followButton: {
    width: '100%',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  eventsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  viewAllButton: {
    marginTop: 12,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  // Bottom Tab Bar styles
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  createTabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default UserProfileScreen; 