import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ProfileStackParamList } from '../navigation/AppNavigator';
import { AuthContext } from '../context/AuthContext';
import { getProfile, uploadProfileImage, getUserEvents, getUserBookmarks, updateProfile } from '../services/api';
import Button from '../components/Button';
import EventCard from '../components/EventCard';
import theme from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { BlurView } from 'expo-blur';
import { toGradientTuple } from '../utils/gradientUtils';
import { useToast } from '../context/ToastContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'UserEvents'>;

const ProfileScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [userBookmarks, setUserBookmarks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'events' | 'bookmarks'>('events');
  const [dataLoading, setDataLoading] = useState(true);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useContext(AuthContext);
  const { showToast } = useToast();
  
  useEffect(() => {
    loadProfileData();
    
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
  }, []);
  
  useEffect(() => {
    // Animate tab indicator when tab changes
    Animated.spring(tabIndicatorPosition, {
      toValue: activeTab === 'events' ? 0 : SCREEN_WIDTH / 2 - 20,
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [activeTab]);
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  const loadProfileData = async () => {
    setDataLoading(true);
    try {
      const responses = await Promise.all([
        getProfile(),
        getUserEvents(),
        getUserBookmarks()
      ]);
      
      setProfileData(responses[0].data.user);
      setUserEvents(responses[1].data.events);
      
      // Fix bookmarks data access - server returns bookmarkedEvents
      if (responses[2].data.bookmarkedEvents) {
        setUserBookmarks(responses[2].data.bookmarkedEvents);
      } else {
        console.error('[DEBUG] Unexpected bookmarks response format:', responses[2].data);
        setUserBookmarks([]);
      }
      
      console.log('[DEBUG] Profile data loaded:', {
        profileDataLoaded: !!responses[0].data.user,
        userEventsCount: responses[1].data.events?.length || 0,
        userBookmarksCount: responses[2].data.bookmarkedEvents?.length || 0
      });
    } catch (error) {
      console.error('Error loading profile data:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setDataLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };
  
  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'You need to grant access to your photos to upload a profile picture.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets[0].uri) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      await uploadProfileImage(uri);
      await loadProfileData();
      showToast('Profile picture updated successfully!', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  const navigateToUserEvents = () => {
    navigation.navigate('UserEvents');
  };
  
  const navigateToUserBookmarks = () => {
    navigation.navigate('UserBookmarks');
  };
  
  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() }
      ]
    );
  };
  
  if (dataLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }
  
  const getMemberSince = () => {
    if (!profileData?.created_at) return '';
    const date = new Date(profileData.created_at);
    return `Member since ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
        <BlurView intensity={80} style={styles.blurView}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitleSmall}>My Profile</Text>
            <TouchableOpacity 
              style={styles.settingsButtonSmall} 
              onPress={navigateToSettings}
            >
              <Ionicons name="settings-outline" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>
      
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
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
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={navigateToSettings}
          >
            <LinearGradient
              colors={theme.gradients.primary}
              style={styles.settingsButtonGradient}
            >
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <Card
          style={styles.profileCard}
          variant="elevated"
          elevation="lg"
        >
          <LinearGradient
            colors={theme.gradients.cool}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCardHeader}
          />
          
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              {uploading ? (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                </View>
              ) : null}
              
              <Avatar 
                size={120}
                image={profileData?.profile_image}
                name={profileData?.full_name || profileData?.username}
                onPress={handleImagePick}
                showEditButton
              />
            </View>
            
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>
                {profileData?.full_name || profileData?.username}
              </Text>
              
              <Text style={styles.userUsername}>@{profileData?.username}</Text>
              
              <Badge 
                text={getMemberSince()} 
                variant="outline"
                icon="calendar-outline"
                style={styles.memberBadge}
              />
            </View>
            
            {profileData?.bio ? (
              <Text style={styles.userBio}>{profileData.bio}</Text>
            ) : (
              <Text style={styles.noBioText}>No bio added yet</Text>
            )}
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userEvents?.length || 0}</Text>
                <Text style={styles.statLabel}>Events</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userBookmarks?.length || 0}</Text>
                <Text style={styles.statLabel}>Bookmarks</Text>
              </View>
            </View>
            
            <Button
              title="Edit Profile"
              onPress={navigateToSettings}
              icon={<Ionicons name="create-outline" size={18} color="#FFFFFF" />}
              style={styles.editButton}
              gradient={true}
              gradientColors={toGradientTuple(theme.gradients.primary)}
            />
          </View>
        </Card>
        
        <View style={styles.tabsContainer}>
          <Animated.View 
            style={[
              styles.tabIndicator, 
              { left: tabIndicatorPosition }
            ]} 
          />
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setActiveTab('events')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'events' && styles.activeTabButtonText
              ]}
            >
              My Events
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setActiveTab('bookmarks')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'bookmarks' && styles.activeTabButtonText
              ]}
            >
              Bookmarks
            </Text>
          </TouchableOpacity>
        </View>
        
        {activeTab === 'events' ? (
          <View style={styles.eventsContainer}>
            {userEvents?.length > 0 ? (
              <>
                {userEvents.slice(0, 2).map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
                
                {userEvents.length > 2 && (
                  <Button
                    title="View All Events"
                    onPress={navigateToUserEvents}
                    icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
                    iconPosition="right"
                    style={styles.viewAllButton}
                    gradient={true}
                    gradientColors={toGradientTuple(theme.gradients.cool)}
                  />
                )}
              </>
            ) : (
              <Card style={styles.emptyStateContainer} variant="outlined">
                <Ionicons 
                  name="calendar-outline" 
                  size={64} 
                  color={theme.colors.textTertiary} 
                />
                <Text style={styles.emptyStateTitle}>No Events</Text>
                <Text style={styles.emptyStateDescription}>
                  You haven't created any events yet
                </Text>
                <Button
                  title="Create Event"
                  onPress={() => navigation.navigate('CreateEvent' as any)}
                  icon={<Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />}
                  style={styles.createButton}
                  size="small"
                  gradient={true}
                  gradientColors={toGradientTuple(theme.gradients.primary)}
                />
              </Card>
            )}
          </View>
        ) : (
          <View style={styles.eventsContainer}>
            {userBookmarks?.length > 0 ? (
              <>
                {userBookmarks.slice(0, 2).map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
                
                {userBookmarks.length > 2 && (
                  <Button
                    title="View All Bookmarks"
                    onPress={navigateToUserBookmarks}
                    icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
                    iconPosition="right"
                    style={styles.viewAllButton}
                    gradient={true}
                    gradientColors={toGradientTuple(theme.gradients.cool)}
                  />
                )}
              </>
            ) : (
              <Card style={styles.emptyStateContainer} variant="outlined">
                <Ionicons 
                  name="bookmark-outline" 
                  size={64} 
                  color={theme.colors.textTertiary} 
                />
                <Text style={styles.emptyStateTitle}>No Bookmarks</Text>
                <Text style={styles.emptyStateDescription}>
                  You haven't bookmarked any events yet
                </Text>
                <Button
                  title="Explore Events"
                  onPress={() => navigation.navigate('EventsTab' as any)}
                  icon={<Ionicons name="search-outline" size={18} color="#FFFFFF" />}
                  style={styles.createButton}
                  size="small"
                  gradient={true}
                  gradientColors={toGradientTuple(theme.gradients.primary)}
                />
              </Card>
            )}
          </View>
        )}
        
        <Button
          title="Logout"
          onPress={handleLogout}
          icon={<Ionicons name="log-out-outline" size={18} color="#FFFFFF" />}
          style={styles.logoutButton}
          gradient={true}
          gradientColors={toGradientTuple(theme.gradients.error)}
        />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitleSmall: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  settingsButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  settingsButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  settingsButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    marginBottom: 24,
    padding: 0,
    overflow: 'hidden',
  },
  profileCardHeader: {
    height: 100,
    width: '100%',
  },
  profileContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: -60,
    marginBottom: 16,
    alignItems: 'center',
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
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
  noBioText: {
    fontSize: 15,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: 16,
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
  editButton: {
    minWidth: 180,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 16,
    padding: 4,
    position: 'relative',
    height: 50,
  },
  tabIndicator: {
    position: 'absolute',
    height: 42,
    width: SCREEN_WIDTH / 2 - 24,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    top: 4,
    ...theme.shadows.sm,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeTabButtonText: {
    color: theme.colors.text,
  },
  eventsContainer: {
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
  createButton: {
    paddingHorizontal: 16,
  },
  logoutButton: {
    marginBottom: 20,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

export default ProfileScreen; 