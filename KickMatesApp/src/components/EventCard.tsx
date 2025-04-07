import React, { useEffect, useRef, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ImageBackground,
  Animated,
  Platform,
  Dimensions,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EventsStackParamList, ProfileStackParamList } from '../navigation/AppNavigator';
import { formatDistance } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { navigateToUserProfile } from '../utils/navigation';
import { BlurView } from 'expo-blur';

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
    bookmarked_by_user?: boolean;
  };
  compact?: boolean;
  index?: number;
  onPress?: () => void;
  onBookmarkPress?: () => void;
  showBookmarkButton?: boolean;
}

// Default placeholder image when no other images are available
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80';
const SCREEN_WIDTH = Dimensions.get('window').width;

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  compact = false, 
  index = 0,
  onPress,
  onBookmarkPress,
  showBookmarkButton = false
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<EventsStackParamList>>();
  const profileNavigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user: currentUser } = useContext(AuthContext);
  const animatedScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  // Enhanced staggered animation for list items
  React.useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.spring(animatedScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true
        })
      ]),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      })
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.sequence([
      Animated.spring(animatedScale, {
        toValue: 0.97,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(animatedScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
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
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('EventDetail', { id: event.id.toString() });
    }
  };
  
  const handleCreatorPress = () => {
    if (event.creator) {
      navigateToUserProfile(navigation, event.creator.id, currentUser?.id);
    }
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
  
  // Enhanced animation style
  const animatedStyle = {
    transform: [
      { scale: animatedScale },
      { translateY: slideAnim }
    ],
    opacity: fadeAnim,
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
          <ImageBackground 
            source={{ uri: event.image_url || getSportImageUrl() }} 
            style={styles.compactImageContainer}
            imageStyle={styles.compactImage}
          >
            <LinearGradient 
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.compactImageOverlay}
            />
            
            {showBookmarkButton && (
              <BlurView intensity={80} style={styles.bookmarkButton}>
                <TouchableOpacity 
                  onPress={onBookmarkPress}
                  hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={event.bookmarked_by_user ? "bookmark" : "bookmark-outline"} 
                    size={22} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
              </BlurView>
            )}
          </ImageBackground>
          <View style={styles.compactContent}>
            <View style={styles.compactSportBadge}>
              <LinearGradient
                colors={getSportGradient()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.compactSportGradient}
              >
                {renderSportIcon()}
                <Text style={styles.compactSportText}>{event.sport_type}</Text>
              </LinearGradient>
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
        <LinearGradient
          colors={['rgb(255, 255, 255)', 'rgb(248, 250, 252)', 'rgb(226, 232, 240)']}
          start={{ x: 0, y: 0 }}
          end={{ x: Math.cos(1 * Math.PI / 180), y: Math.sin(1 * Math.PI / 180) }}
          style={[styles.cardGradient, { 
            borderWidth: 1,
            borderColor: 'rgba(226, 232, 240, 0.6)'
          }]}
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
                {showBookmarkButton && (
                  <BlurView intensity={80} style={styles.bookmarkButtonFull}>
                    <TouchableOpacity 
                      onPress={onBookmarkPress}
                      hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={event.bookmarked_by_user ? "bookmark" : "bookmark-outline"} 
                        size={24} 
                        color="#FFFFFF" 
                      />
                    </TouchableOpacity>
                  </BlurView>
                )}
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
            <View style={styles.contentRow}>
              <View style={styles.tagContainer}>
                <View style={styles.iconWrapper}>
                  <LinearGradient
                    colors={['#F1F5F9', '#E2E8F0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconGradient}
                  >
                    <Ionicons name="people" size={16} color="#64748B" />
                  </LinearGradient>
                </View>
                <Text style={styles.tagText}>
                  {event.current_players || 0} / {event.max_players}
                </Text>
              </View>

              <View style={styles.tagContainer}>
                <View style={styles.iconWrapper}>
                  <LinearGradient
                    colors={['#F1F5F9', '#E2E8F0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconGradient}
                  >
                    {renderSportIcon()}
                  </LinearGradient>
                </View>
                <Text style={styles.tagText}>{event.sport_type}</Text>
              </View>
            </View>
            
            {event.creator && (
              <TouchableOpacity style={styles.creatorInfo} onPress={handleCreatorPress}>
                {event.creator.profile_image ? (
                  <Image source={{ uri: event.creator.profile_image }} style={styles.creatorImage} />
                ) : (
                  <LinearGradient
                    colors={getSportGradient()}
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
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(71, 85, 105, 0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      }
    }),
    marginBottom: 20,
  },
  cardGradient: {
    borderRadius: 20,
  },
  image: {
    height: 220,
    width: '100%',
  },
  imageStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  topOverlayContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bottomOverlayContent: {
    marginBottom: 12,
  },
  sportBadge: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  sportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sportText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  eventInfo: {
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    color: '#E2E8F0',
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      }
    }),
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 8,
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    paddingRight: 8,
    textTransform: 'capitalize',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  creatorImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorImagePlaceholderText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  creatorName: {
    marginLeft: 10,
    color: '#64748B',
    fontWeight: '600',
    fontSize: 15,
  },
  compactContainer: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      }
    }),
    marginBottom: 12,
  },
  compactImageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  compactImage: {
    height: '100%',
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  compactImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  compactContent: {
    padding: 16,
  },
  compactSportBadge: {
    marginBottom: 8,
  },
  compactSportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
  },
  compactSportText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  compactTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
  },
  compactDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  compactDate: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 6,
  },
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 20,
    padding: 10,
    zIndex: 10,
  },
  bookmarkButtonFull: {
    borderRadius: 20,
    padding: 10,
    zIndex: 10,
  },
});

export default EventCard; 