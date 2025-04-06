import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import Input from '../components/Input';
import Button from '../components/Button';
import { createEvent } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../components/Card';
import theme from '../theme/theme';
import { BlurView } from 'expo-blur';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SPORT_ITEM_WIDTH = (SCREEN_WIDTH - 64) / 3;

type Sport = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
};

const sports: Sport[] = [
  { id: 'soccer', name: 'Soccer', icon: 'football-outline', gradient: theme.gradients.primary },
  { id: 'basketball', name: 'Basketball', icon: 'basketball-outline', gradient: theme.gradients.accent },
  { id: 'tennis', name: 'Tennis', icon: 'tennisball-outline', gradient: theme.gradients.success },
  { id: 'volleyball', name: 'Volleyball', icon: 'baseball-outline', gradient: theme.gradients.warm },
  { id: 'baseball', name: 'Baseball', icon: 'baseball-outline', gradient: theme.gradients.warning },
  { id: 'football', name: 'Football', icon: 'american-football-outline', gradient: theme.gradients.error },
  { id: 'golf', name: 'Golf', icon: 'golf-outline', gradient: theme.gradients.secondary },
  { id: 'swimming', name: 'Swimming', icon: 'water-outline', gradient: theme.gradients.cool },
  { id: 'running', name: 'Running', icon: 'walk-outline', gradient: theme.gradients.primary },
  { id: 'cycling', name: 'Cycling', icon: 'bicycle-outline', gradient: theme.gradients.secondary },
  { id: 'yoga', name: 'Yoga', icon: 'body-outline', gradient: theme.gradients.accent },
  { id: 'pickleball', name: 'Pickleball', icon: 'tennisball-outline', gradient: theme.gradients.success },
  { id: 'padel', name: 'Padel', icon: 'tennisball-outline', gradient: theme.gradients.warm },
  { id: 'other', name: 'Other', icon: 'fitness-outline', gradient: theme.gradients.cool },
];

const CreateEventScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Animation values for fade-in effects
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [sportId, setSportId] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Form validation
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    location: '',
    sportId: '',
  });
  
  // Start animation when component mounts
  React.useEffect(() => {
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
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      title: '',
      description: '',
      location: '',
      sportId: '',
    };
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }
    
    if (!location.trim()) {
      newErrors.location = 'Location is required';
      isValid = false;
    }
    
    if (!sportId) {
      newErrors.sportId = 'Please select a sport';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permission to upload images.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Combine date and time
      const eventDateTime = new Date(date);
      eventDateTime.setHours(time.getHours(), time.getMinutes());
      
      // Create event data object to match API expectations
      const eventData = {
        title: title,
        description: description,
        sport_type: sportId,
        location: location,
        start_date: eventDateTime.toISOString(),
        end_date: new Date(eventDateTime.getTime() + 2 * 60 * 60 * 1000).toISOString(), // Default to 2 hours
        max_players: parseInt(maxParticipants),
        image_url: image || undefined
      };
      
      const response = await createEvent(eventData);
      
      Alert.alert(
        'Success',
        'Your event has been created!',
        [
          {
            text: 'OK',
            onPress: () => {
              // @ts-ignore - Navigation typing issue
              navigation.navigate('EventsTab', {
                screen: 'EventDetail',
                params: { id: response.data.event.id.toString() }
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };
  
  const onTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };
  
  const getSportById = (id: string) => {
    return sports.find(sport => sport.id === id);
  };
  
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
            <Text style={styles.headerTitle}>Create New Event</Text>
            <View style={{ width: 24 }} />
          </View>
        </BlurView>
      </Animated.View>
    
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
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
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create New Event</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <Card 
            style={styles.imagePickerCard}
            variant="elevated"
            elevation="md"
            onPress={pickImage}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.eventImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <LinearGradient
                  colors={theme.gradients.primary}
                  style={styles.imageIconGradient}
                >
                  <Ionicons name="image-outline" size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.imagePlaceholderText}>Tap to add an event image</Text>
              </View>
            )}
          </Card>
          
          <View style={styles.formContainer}>
            <Input
              label="Event Title"
              placeholder="What's your event called?"
              value={title}
              onChangeText={setTitle}
              error={errors.title}
              autoCapitalize="words"
              leftIcon="text-outline"
              required
            />
            
            <Input
              label="Description"
              placeholder="Describe your event, what should participants know?"
              value={description}
              onChangeText={setDescription}
              error={errors.description}
              multiline
              numberOfLines={4}
              style={styles.textArea}
              leftIcon="document-text-outline"
              required
            />
            
            <Input
              label="Location"
              placeholder="Where will it take place?"
              value={location}
              onChangeText={setLocation}
              error={errors.location}
              leftIcon="location-outline"
              required
            />
            
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateContainer}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.dateTimeText}>
                    {format(date, 'MMMM d, yyyy')}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.timeContainer}>
                <Text style={styles.label}>Time</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.dateTimeText}>
                    {format(time, 'h:mm a')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
            
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
            
            <Input
              label="Maximum Participants"
              placeholder="10"
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              keyboardType="number-pad"
              leftIcon="people-outline"
            />
            
            <Text style={styles.label}>Sport Type</Text>
            {errors.sportId ? <Text style={styles.errorText}>{errors.sportId}</Text> : null}
            
            <View style={styles.sportsContainer}>
              {sports.map((sport) => {
                const isSelected = sportId === sport.id;
                return (
                  <TouchableOpacity
                    key={sport.id}
                    style={[
                      styles.sportItem,
                      { width: SPORT_ITEM_WIDTH }
                    ]}
                    onPress={() => setSportId(sport.id)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={isSelected ? sport.gradient : ['#F1F5F9', '#E2E8F0']}
                      style={[
                        styles.sportGradient,
                        isSelected && styles.selectedSportGradient
                      ]}
                    >
                      <Ionicons 
                        name={sport.icon} 
                        size={24} 
                        color={isSelected ? '#FFFFFF' : theme.colors.primary} 
                      />
                    </LinearGradient>
                    <Text style={[
                      styles.sportName,
                      isSelected && styles.selectedSportText
                    ]}>
                      {sport.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <Button
              title="Create Event"
              onPress={handleSubmit}
              style={styles.submitButton}
              disabled={isLoading}
              gradient={true}
              gradientColors={theme.gradients.primary}
              size="large"
              icon={<Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />}
            />
          </View>
        </Animated.ScrollView>
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Creating your event...</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  imagePickerCard: {
    marginHorizontal: 16,
    height: 220,
    marginBottom: 24,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.lg,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
  },
  imageIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePlaceholderText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateContainer: {
    flex: 1,
    marginRight: 8,
  },
  timeContainer: {
    flex: 1,
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: theme.colors.surface,
  },
  dateTimeText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.text,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  sportItem: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sportGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      }
    }),
  },
  selectedSportGradient: {
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      }
    }),
  },
  sportIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  sportName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  selectedSportText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 12,
    marginBottom: 32,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginBottom: 8,
  },
});

export default CreateEventScreen; 