import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EventsStackParamList } from '../navigation/AppNavigator';
import { getEvents } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import Button from '../components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SharedElement } from 'react-navigation-shared-element';

type HomeScreenNavigationProp = NativeStackNavigationProp<EventsStackParamList, 'EventsList'>;

interface SportCategory {
  id: string;
  name: string;
  image: any;
  gradient: string[];
  icon: keyof typeof Ionicons.glyphMap;
}

const sportCategories: SportCategory[] = [
  { 
    id: '1', 
    name: 'Football', 
    image: require('../assets/images/football.jpg'),
    gradient: ['#4CC9F0', '#4361EE'],
    icon: 'football-outline'
  },
  { 
    id: '2', 
    name: 'Basketball', 
    image: require('../assets/images/basketball.jpg'),
    gradient: ['#F72585', '#7209B7'],
    icon: 'basketball-outline'
  },
  { 
    id: '3', 
    name: 'Tennis', 
    image: require('../assets/images/tennis.jpg'),
    gradient: ['#4ADE80', '#10B981'],
    icon: 'tennisball-outline'
  },
  { 
    id: '4', 
    name: 'Yoga', 
    image: require('../assets/images/yoga.jpg'),
    gradient: ['#8B5CF6', '#6D28D9'],
    icon: 'body-outline'
  },
  { 
    id: '5', 
    name: 'Running', 
    image: require('../assets/images/running.jpg'),
    gradient: ['#FB923C', '#F97316'],
    icon: 'walk-outline'
  },
  { 
    id: '6', 
    name: 'Cycling', 
    image: require('../assets/images/cycling.jpg'),
    gradient: ['#3B82F6', '#2563EB'],
    icon: 'bicycle-outline'
  },
  { 
    id: '7', 
    name: 'Pickleball', 
    image: require('../assets/images/tennis.jpg'), // Temporarily using tennis image
    gradient: ['#4ADE80', '#10B981'],
    icon: 'tennisball-outline'
  },
  { 
    id: '8', 
    name: 'Padel', 
    image: require('../assets/images/tennis.jpg'), // Temporarily using tennis image
    gradient: ['#F59E0B', '#D97706'],
    icon: 'tennisball-outline'
  },
];

const HomeScreen = () => {
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useContext(AuthContext);
  
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 40) / 2;
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  // Animation for staggered category items
  const fadeInAnims = sportCategories.map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    fetchEvents();
    
    // Staggered animation for sport categories
    const animations = fadeInAnims.map((anim, i) => {
      return Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 300 + (i * 100),
        useNativeDriver: true
      });
    });
    
    Animated.stagger(100, animations).start();
  }, []);
  
  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // console.log('[HOME] Attempting to fetch events from API...');
      const res = await getEvents({ limit: 4 });
      setFeaturedEvents(res.data.events || []);
      // console.log('[HOME] Events fetched successfully!');
    } catch (err) {
      console.error('[HOME] Error fetching events:', err);
      // More detailed error logging
      if (typeof err === 'object' && err !== null) {
        if ('message' in err) {
          console.error('[HOME] Error message:', (err as {message: string}).message);
        }
        if ('response' in err && typeof err.response === 'object' && err.response !== null) {
          const response = err.response as {status?: number; data?: unknown};
          if (response.status) console.error('[HOME] Response status:', response.status);
          if (response.data) console.error('[HOME] Response data:', JSON.stringify(response.data));
        }
      }
      
      // More detailed error message
      if (typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string' && err.message.includes('Network Error')) {
        setError('Cannot connect to server. Please check your internet connection.');
      } else if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null) {
        const response = err.response as {status?: number; data?: {message?: string}};
        setError(`Server error: ${response.status} - ${response.data?.message || 'Unknown error'}`);
      } else {
        setError('Failed to load events. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };
  
  const navigateToCreateEvent = () => {
    navigation.dispatch(
      CommonActions.navigate('CreateEvent')
    );
  };
  
  const navigateToEventsList = () => {
    navigation.navigate('EventsList');
  };
  
  const renderSportCategory = ({ item, index }: { item: SportCategory, index: number }) => {
    const animatedStyle = {
      opacity: fadeInAnims[index],
      transform: [
        { 
          translateY: fadeInAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          }) 
        }
      ]
    };
    
    return (
      <Animated.View style={[animatedStyle, { width: cardWidth }]}>
        <TouchableOpacity 
          style={styles.categoryItem} 
          onPress={() => navigation.navigate('EventsList')}
          activeOpacity={0.9}
        >
          <SharedElement id={`category.${item.id}.image`}>
            <ImageBackground
              source={item.image}
              style={styles.categoryImage}
              imageStyle={styles.categoryImageStyle}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
                style={styles.categoryOverlay}
              >
                <View style={styles.categoryContent}>
                  <View style={styles.categoryIconContainer}>
                    <LinearGradient
                      colors={item.gradient}
                      style={styles.categoryIconGradient}
                    >
                      <Ionicons name={item.icon} size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.categoryName}>{item.name}</Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </SharedElement>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Fixed Header (always visible) */}
      <View style={styles.fixedHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>KickMates</Text>
          <TouchableOpacity style={styles.profileButton}>
            {user?.profile_image ? (
              <Image source={{ uri: user.profile_image }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>
                  {user?.full_name?.charAt(0) || 'K'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Greeting Section with Animation */}
        <View style={styles.greetingSection}>
          <View>
            <Text style={styles.greetingText}>Hey{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! 👋</Text>
            <Text style={styles.greetingSubtext}>Ready to find teammates?</Text>
          </View>
          <TouchableOpacity 
            style={styles.createEventButtonContainer}
            onPress={navigateToCreateEvent}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4361EE', '#4CC9F0']}
              style={styles.createEventGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add-circle" size={22} color="#FFFFFF" />
              <Text style={styles.createEventText}>Create Event</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Featured Events Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Events</Text>
            <TouchableOpacity style={styles.viewAllButton} onPress={navigateToEventsList}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#4361EE" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#4361EE" />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={24} color="#F87171" />
              <Text style={styles.errorText}>{error}</Text>
              <Button
                title="Retry"
                onPress={fetchEvents}
                variant="outline"
                style={styles.retryButton}
              />
            </View>
          ) : featuredEvents.length > 0 ? (
            <FlatList
              data={featuredEvents}
              renderItem={({ item, index }) => <EventCard event={item} index={index} />}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.eventsList}
              contentContainerStyle={styles.eventsListContent}
              snapToAlignment="start"
              decelerationRate="fast"
              snapToInterval={screenWidth - 24}
              pagingEnabled
            />
          ) : (
            <View style={styles.noEventsContainer}>
              <Image 
                source={require('../assets/images/no-events.png')}
                style={styles.noEventsImage}
              />
              <Text style={styles.noEventsText}>No events found. Be the first to create one!</Text>
              <TouchableOpacity 
                style={styles.createEventButtonContainer}
                onPress={navigateToCreateEvent}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4361EE', '#4CC9F0']}
                  style={styles.createEventGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="add-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.createEventText}>Create Event</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sport Categories Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.popularSportsTitle}>Popular Sports</Text>
          <View style={styles.categoriesWrapper}>
            <FlatList
              data={sportCategories}
              renderItem={renderSportCategory}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.categoriesContainer}
              columnWrapperStyle={styles.categoryColumnWrapper}
            />
          </View>
        </View>

        {/* How It Works Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.howItWorksSectionTitle}>How KickMates Works</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <LinearGradient 
                colors={['#4CC9F0', '#4361EE']} 
                style={styles.stepIconContainer}
              >
                <Text style={styles.stepIcon}>1</Text>
              </LinearGradient>
              <Text style={styles.stepTitle}>Find an Event</Text>
              <Text style={styles.stepDescription}>
                Search for sports events near you based on your interests.
              </Text>
            </View>
            
            <View style={styles.step}>
              <LinearGradient 
                colors={['#7C3AED', '#6D28D9']} 
                style={styles.stepIconContainer}
              >
                <Text style={styles.stepIcon}>2</Text>
              </LinearGradient>
              <Text style={styles.stepTitle}>Join or Create</Text>
              <Text style={styles.stepDescription}>
                Join existing events or create your own to invite others.
              </Text>
            </View>
            
            <View style={styles.step}>
              <LinearGradient 
                colors={['#4ADE80', '#10B981']} 
                style={styles.stepIconContainer}
              >
                <Text style={styles.stepIcon}>3</Text>
              </LinearGradient>
              <Text style={styles.stepTitle}>Meet & Play</Text>
              <Text style={styles.stepDescription}>
                Connect with other players, make friends, and enjoy sports.
              </Text>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  fixedHeader: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4361EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 16,
    color: '#64748B',
  },
  sectionContainer: {
    marginBottom: -10,
    // marginRight: 16,
    // marginLeft: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    paddingHorizontal: 16,
    marginBottom: 10,
    // marginTop: 16,
  },
  popularSportsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    paddingHorizontal: 16,
    marginBottom: 16,
    textAlign: 'center',

  },
  howItWorksSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    paddingHorizontal: 16,
    marginBottom: 32,
    marginTop: 32,
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#4361EE',
    fontWeight: '600',
    marginRight: 2,
  },
  loaderContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#B91C1C',
    marginVertical: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
  eventsList: {
    marginBottom: 16,
  },
  eventsListContent: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  noEventsContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEventsImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
    opacity: 0.7,
  },
  noEventsText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },
  createEventButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      }
    }),
  },
  createEventGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  createEventText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginHorizontal: -4,
  },
  categoryItem: {
    margin: 4,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      }
    }),
  },
  categoryImage: {
    height: 160,
    width: '100%',
  },
  categoryImageStyle: {
    borderRadius: 16,
  },
  categoryOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  categoryContent: {
    alignItems: 'center',
  },
  categoryIconContainer: {
    marginBottom: 8,
  },
  categoryIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      }
    }),
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  stepsContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  step: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      }
    }),
  },
  stepIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  categoriesWrapper: {
    width: '100%',
  },
  categoryColumnWrapper: {
    justifyContent: 'space-between',
  },
});

export default HomeScreen; 