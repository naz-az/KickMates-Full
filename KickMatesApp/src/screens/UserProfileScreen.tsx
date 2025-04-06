import React, { useState, useEffect, useRef } from 'react';
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

// Assuming these would exist in a real implementation
type UserProfileScreenRouteProp = RouteProp<{
  UserProfile: { userId: string };
}, 'UserProfile'>;

const UserProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<UserProfileScreenRouteProp>();
  const userId = route.params?.userId;
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // State
  const [userData, setUserData] = useState<any>(null);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  
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
    
    // Load user data
    loadUserData();
  }, [userId]);
  
  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, we would fetch user data from API
      // For demonstration purposes, we're setting mock data after a delay
      setTimeout(() => {
        setUserData({
          id: userId || '123',
          username: 'sportsEnthusiast',
          full_name: 'Alex Johnson',
          profile_image: 'https://randomuser.me/api/portraits/men/32.jpg',
          bio: 'Sports enthusiast and community organizer. Love playing basketball and soccer on weekends.',
          followers_count: 243,
          events_count: 15,
          created_at: '2022-06-15T00:00:00Z',
        });
        
        setUserEvents([
          {
            id: 1,
            title: 'Weekend Basketball',
            description: 'Casual basketball game at Central Park courts',
            location: 'Central Park, NY',
            date: new Date(Date.now() + 86400000 * 3).toISOString(),
            sport_type: 'basketball',
            image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc',
            participants_count: 8,
            max_players: 10,
          },
          {
            id: 2,
            title: 'Soccer Tournament',
            description: 'Neighborhood soccer tournament - 5v5 teams',
            location: 'Riverside Fields',
            date: new Date(Date.now() + 86400000 * 5).toISOString(),
            sport_type: 'soccer',
            image_url: 'https://images.unsplash.com/photo-1517927033932-35078d4c4fe5',
            participants_count: 18,
            max_players: 30,
          },
        ]);
        
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsLoading(false);
    }
  };
  
  const toggleFollow = () => {
    // In a real implementation, we would call an API to follow/unfollow
    setIsFollowing(prev => !prev);
  };
  
  const getMemberSince = () => {
    if (!userData?.created_at) return '';
    const date = new Date(userData.created_at);
    return `Member since ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
                image={userData?.profile_image}
                name={userData?.full_name || userData?.username}
              />
            </View>
            
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>
                {userData?.full_name || userData?.username}
              </Text>
              
              <Text style={styles.userUsername}>@{userData?.username}</Text>
              
              <Badge 
                text={getMemberSince()} 
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
                <Text style={styles.statValue}>{userData?.events_count || 0}</Text>
                <Text style={styles.statLabel}>Events</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData?.followers_count || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>
            
            <Button
              title={isFollowing ? "Following" : "Follow"}
              onPress={toggleFollow}
              icon={<Ionicons name={isFollowing ? "checkmark-circle" : "person-add"} size={18} color="#FFFFFF" />}
              style={styles.followButton}
              gradient={true}
              gradientColors={isFollowing ? theme.gradients.success : theme.gradients.primary}
            />
          </View>
        </Card>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Events by {userData?.full_name?.split(' ')[0] || userData?.username}</Text>
        </View>
        
        {userEvents.length > 0 ? (
          <View style={styles.eventsContainer}>
            {userEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        ) : (
          <Card style={styles.emptyStateContainer} variant="outlined">
            <Ionicons 
              name="calendar-outline" 
              size={64} 
              color={theme.colors.textTertiary} 
            />
            <Text style={styles.emptyStateTitle}>No Events</Text>
            <Text style={styles.emptyStateDescription}>
              This user hasn't created any events yet
            </Text>
          </Card>
        )}
        
        <View style={styles.spacer} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  blurView: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitleSmall: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  profileCard: {
    marginBottom: 24,
    padding: 0,
    overflow: 'hidden',
  },
  profileCardHeader: {
    height: 80,
    width: '100%',
  },
  profileContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: -55,
    marginBottom: 16,
    alignItems: 'center',
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  memberBadge: {
    marginTop: 4,
  },
  userBio: {
    fontSize: 15,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: theme.colors.border,
  },
  followButton: {
    minWidth: 160,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  eventsContainer: {
    marginBottom: 24,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginBottom: 24,
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
  },
  spacer: {
    height: 30,
  },
});

export default UserProfileScreen; 