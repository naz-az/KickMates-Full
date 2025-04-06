import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ImageBackground,
  Animated,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EventsStackParamList } from '../navigation/AppNavigator';
import { formatDistance } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

type EventCardNavigationProp = NativeStackNavigationProp<EventsStackParamList, 'EventDetail'>;

interface EventCardProps {
  event: {
    id: string | number;
    title: string;
    sport_type: string;
    location: string;
    start_date: string;
    end_date: string;
    current_players?: number;
    max_players: number;
    image_url?: string;
    creator?: {
      id: number;
      username: string;
      profile_image?: string;
    };
  };
  compact?: boolean;
  index?: number;
}

// Default placeholder image when no other images are available
const DEFAULT_IMAGE = 'https://via.placeholder.com/400x300?text=Sport+Event';
const SCREEN_WIDTH = Dimensions.get('window').width;

const EventCard: React.FC<EventCardProps> = ({ event, compact = false, index = 0 }) => {
  const navigation = useNavigation<EventCardNavigationProp>();
  const animatedScale = React.useRef(new Animated.Value(1)).current;
  
  // Staggered animation for list items
  React.useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 100),
      Animated.spring(animatedScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(animatedScale, {
      toValue: 0.97,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(animatedScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePress = () => {
    navigation.navigate('EventDetail', { id: event.id });
  };
  
  const renderSportIcon = () => {
    let iconName: keyof typeof Ionicons.glyphMap = 'football-outline';
    
    // Check if sport_type exists to prevent 'Cannot read properties of undefined' error
    if (!event.sport_type) {
      return <Ionicons name={iconName} size={compact ? 16 : 18} color="#4361EE" />;
    }
    
    // Map sport type to appropriate icon
    switch (event.sport_type.toLowerCase()) {
      case 'football':
      case 'soccer':
        iconName = 'football-outline';
        break;
      case 'basketball':
        iconName = 'basketball-outline';
        break;
      case 'tennis':
        iconName = 'tennisball-outline';
        break;
      case 'volleyball':
        iconName = 'baseball-outline';
        break;
      case 'cricket':
        iconName = 'golf-outline';
        break;
      case 'rugby':
        iconName = 'american-football-outline';
        break;
      case 'golf':
        iconName = 'golf-outline';
        break;
      case 'swimming':
        iconName = 'water-outline';
        break;
      case 'yoga':
        iconName = 'body-outline';
        break;
      case 'running':
        iconName = 'walk-outline';
        break;
      case 'cycling':
        iconName = 'bicycle-outline';
        break;
      default:
        iconName = 'fitness-outline';
    }
    
    return <Ionicons name={iconName} size={compact ? 16 : 18} color="#4361EE" />;
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'Date not set';
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  const getSportImageUrl = () => {
    // Check if sport_type exists to prevent 'Cannot read properties of undefined' error
    if (!event.sport_type) {
      return DEFAULT_IMAGE;
    }
    
    const sportType = event.sport_type.toLowerCase();
    
    switch (sportType) {
      case 'football':
      case 'soccer':
        return 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80';
      case 'basketball':
        return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80';
      case 'tennis':
        return 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80';
      case 'volleyball':
        return 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80';
      case 'cricket':
        return 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80';
      case 'rugby':
        return 'https://images.unsplash.com/photo-1544013352-31c25bd0a609?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80';
      default:
        return DEFAULT_IMAGE;
    }
  };

  // Get a background color based on sport type for consistent theming
  const getSportGradient = () => {
    // Check if sport_type exists to prevent 'Cannot read properties of undefined' error
    if (!event.sport_type) {
      return ['#4361EE', '#3A0CA3']; // Default gradient
    }
    
    const sportType = event.sport_type.toLowerCase();
    
    switch (sportType) {
      case 'football':
      case 'soccer':
        return ['#4CC9F0', '#4361EE'];
      case 'basketball':
        return ['#F72585', '#7209B7'];
      case 'tennis':
        return ['#4ADE80', '#10B981'];
      case 'volleyball':
        return ['#FB923C', '#F97316'];
      case 'cricket':
        return ['#FBBF24', '#F59E0B'];
      case 'rugby':
        return ['#7C3AED', '#6D28D9'];
      default:
        return ['#4361EE', '#3A0CA3'];
    }
  };
  
  // Scale in animation style
  const animatedStyle = {
    transform: [{ scale: animatedScale }],
    opacity: animatedScale,
  };
  
  if (compact) {
    return (
      <Animated.View style={[animatedStyle, { marginHorizontal: 8 }]}>
        <TouchableOpacity 
          style={styles.compactContainer} 
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <View style={styles.compactImageContainer}>
            <Image 
              source={{ uri: event.image_url || getSportImageUrl() }} 
              style={styles.compactImage} 
            />
            <LinearGradient 
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.compactImageOverlay}
            />
          </View>
          <View style={styles.compactContent}>
            <View style={styles.compactSportBadge}>
              {renderSportIcon()}
              <Text style={styles.compactSportText}>{event.sport_type}</Text>
            </View>
            <Text style={styles.compactTitle} numberOfLines={1}>{event.title}</Text>
            <View style={styles.compactDetails}>
              <Ionicons name="calendar-outline" size={12} color="#64748B" />
              <Text style={styles.compactDate}>{formatDate(event.start_date)}</Text>
            </View>
            <View style={styles.compactDetails}>
              <Ionicons name="people-outline" size={12} color="#64748B" />
              <Text style={styles.compactDate}>{event.current_players || 0}/{event.max_players}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }
  
  return (
    <Animated.View style={[animatedStyle, { width: SCREEN_WIDTH - 32, marginHorizontal: 8 }]}>
      <TouchableOpacity 
        style={styles.container} 
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
      >
        <ImageBackground
          source={{ uri: event.image_url || getSportImageUrl() }}
          style={styles.image}
          imageStyle={styles.imageStyle}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.overlay}
          >
            <View style={styles.topOverlayContent}>
              <View style={styles.sportBadge}>
                {renderSportIcon()}
                <Text style={styles.sportText}>{event.sport_type}</Text>
              </View>
            </View>
            <View style={styles.bottomOverlayContent}>
              <Text style={styles.title}>{event.title}</Text>
              
              <View style={styles.eventInfo}>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={14} color="#E2E8F0" />
                  <Text style={styles.detailText}>{event.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={14} color="#E2E8F0" />
                  <Text style={styles.detailText}>{formatDate(event.start_date)}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
        
        <View style={styles.content}>
          <View style={styles.playersContainer}>
            <LinearGradient
              colors={getSportGradient()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.playersGradient}
            >
              <Ionicons name="people" size={16} color="#FFFFFF" />
              <Text style={styles.playersText}>
                {event.current_players || 0} / {event.max_players}
              </Text>
            </LinearGradient>
          </View>
          
          {event.creator && (
            <View style={styles.creatorInfo}>
              {event.creator.profile_image ? (
                <Image source={{ uri: event.creator.profile_image }} style={styles.creatorImage} />
              ) : (
                <LinearGradient
                  colors={['#4361EE', '#3A0CA3']}
                  style={styles.creatorImagePlaceholder}
                >
                  <Text style={styles.creatorImagePlaceholderText}>
                    {event.creator.username && event.creator.username.length > 0 
                      ? event.creator.username[0].toUpperCase() 
                      : '?'}
                  </Text>
                </LinearGradient>
              )}
              <Text style={styles.creatorName}>
                by {event.creator && event.creator.username ? event.creator.username : 'Unknown'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      }
    }),
    marginBottom: 16,
  },
  image: {
    height: 200,
    width: '100%',
  },
  imageStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  topOverlayContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomOverlayContent: {
    marginBottom: 8,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    alignSelf: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      }
    }),
  },
  sportText: {
    color: '#4361EE',
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  eventInfo: {
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    color: '#E2E8F0',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playersContainer: {
    alignSelf: 'flex-start',
  },
  playersGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
  },
  playersText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 14,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  creatorImagePlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorImagePlaceholderText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  creatorName: {
    marginLeft: 8,
    color: '#64748B',
    fontWeight: '500',
    fontSize: 14,
  },
  compactContainer: {
    width: 200,
    backgroundColor: '#FFFFFF',
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
    marginBottom: 8,
  },
  compactImageContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  compactImage: {
    height: '100%',
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  compactImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  compactContent: {
    padding: 12,
  },
  compactSportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  compactSportText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4361EE',
    marginLeft: 4,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  compactDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactDate: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
});

export default EventCard; 