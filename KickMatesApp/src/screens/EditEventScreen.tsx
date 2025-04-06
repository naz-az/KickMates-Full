import React, { useState, useEffect, useContext } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Input from '../components/Input';
import Button from '../components/Button';
import { getEventById, updateEvent, uploadEventImage } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { EventsStackParamList } from '../navigation/AppNavigator';
import { AuthContext } from '../context/AuthContext';

type Sport = {
  id: string;
  name: string;
  icon: string;
};

const sports: Sport[] = [
  { id: '1', name: 'Soccer', icon: '⚽' },
  { id: '2', name: 'Basketball', icon: '🏀' },
  { id: '3', name: 'Tennis', icon: '🎾' },
  { id: '4', name: 'Volleyball', icon: '🏐' },
  { id: '5', name: 'Baseball', icon: '⚾' },
  { id: '6', name: 'Football', icon: '🏈' },
  { id: '7', name: 'Golf', icon: '⛳' },
  { id: '8', name: 'Swimming', icon: '🏊' },
  { id: '9', name: 'Running', icon: '🏃' },
  { id: '10', name: 'Cycling', icon: '🚴' },
  { id: '11', name: 'Pickleball', icon: '🎾' },
  { id: '12', name: 'Padel', icon: '🎾' },
];

const EditEventScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<EventsStackParamList, 'EditEvent'>>();
  const { id } = route.params;
  const { user } = useContext(AuthContext);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [sportId, setSportId] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Form validation
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    location: '',
    sportId: '',
  });
  
  useEffect(() => {
    const fetchEventDetails = async () => {
      setIsFetching(true);
      try {
        const { data } = await getEventById(id);
        
        // Check if the user is authorized to edit this event
        if (user && data.event.creator_id !== user.id) {
          Alert.alert(
            'Permission Denied',
            'You do not have permission to edit this event. Only the creator can edit events.',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack()
              }
            ]
          );
          return;
        }
        
        const eventData = data.event;
        
        // Update form state
        setTitle(eventData.title);
        setDescription(eventData.description || '');
        setSportId(eventData.sport_type);
        setLocation(eventData.location);
        setMaxParticipants(eventData.max_players.toString());
        
        if (eventData.image_url) {
          setImage(eventData.image_url);
        }
        
        // Parse dates
        const startDate = new Date(eventData.start_date);
        const endDate = new Date(eventData.end_date);
        
        setDate(startDate);
        setTime(startDate);
        setEndDate(endDate);
        setEndTime(endDate);
      } catch (error) {
        console.error('Error fetching event:', error);
        Alert.alert('Error', 'Failed to load event details. Please try again.');
        navigation.goBack();
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchEventDetails();
  }, [id]);
  
  const validateForm = () => {
    let valid = true;
    const newErrors = {
      title: '',
      description: '',
      location: '',
      sportId: '',
    };
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
      valid = false;
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
      valid = false;
    }
    
    if (!location.trim()) {
      newErrors.location = 'Location is required';
      valid = false;
    }
    
    if (!sportId) {
      newErrors.sportId = 'Please select a sport';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const pickImage = async () => {
    // Request permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'You need to allow access to your photos to upload an image.');
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
      // Combine date and time for start and end dates
      const eventDateTime = new Date(date);
      eventDateTime.setHours(time.getHours(), time.getMinutes());
      
      const eventEndDateTime = new Date(endDate);
      eventEndDateTime.setHours(endTime.getHours(), endTime.getMinutes());
      
      // Check if end date is after start date
      if (eventEndDateTime <= eventDateTime) {
        Alert.alert('Invalid Dates', 'End date and time must be after start date and time');
        setIsLoading(false);
        return;
      }
      
      // Create event data object to match API expectations
      const eventData = {
        title: title,
        description: description,
        sport_type: sportId,
        location: location,
        start_date: eventDateTime.toISOString(),
        end_date: eventEndDateTime.toISOString(),
        max_players: parseInt(maxParticipants),
      };
      
      console.log('[APP] Submitting event update for ID:', id);
      
      // First update event details
      const response = await updateEvent(id, eventData);
      console.log('[APP] Update event response:', response.data);
      
      // Then upload image if it's a local file (not a URL)
      if (image && image.startsWith('file://')) {
        setIsUploadingImage(true);
        try {
          await uploadEventImage(id, image);
        } catch (imgError) {
          console.error('[APP] Error uploading image:', imgError);
          Alert.alert(
            'Partial Success',
            'Event details were updated but the image upload failed.'
          );
          setIsLoading(false);
          setIsUploadingImage(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }
      
      Alert.alert(
        'Success',
        'Event has been updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('EventDetail', { id });
            }
          }
        ]
      );
    } catch (error) {
      console.error('[APP] Error updating event:', error);
      
      // Check if the error is a permission/authorization error
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('permission') || errorMessage.includes('authorized')) {
          Alert.alert('Permission Denied', errorMessage);
        } else if (errorMessage.includes('not found')) {
          Alert.alert('Event Not Found', errorMessage);
        } else if (errorMessage.includes('Invalid')) {
          Alert.alert('Invalid Data', errorMessage);
        } else {
          Alert.alert('Error', 'Failed to update event. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Failed to update event. An unexpected error occurred.');
      }
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
  
  const onEndDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setEndDate(currentDate);
  };
  
  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || endTime;
    setShowEndTimePicker(Platform.OS === 'ios');
    setEndTime(currentTime);
  };
  
  if (isFetching) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Event</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.eventImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                <Text style={styles.imagePlaceholderText}>Tap to change the event image</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.formContainer}>
            <Input
              label="Title"
              placeholder="Event title"
              value={title}
              onChangeText={setTitle}
              error={errors.title}
              autoCapitalize="words"
            />
            
            <Input
              label="Description"
              placeholder="Describe your event"
              value={description}
              onChangeText={setDescription}
              error={errors.description}
              multiline
              numberOfLines={4}
              style={styles.textArea}
            />
            
            <Input
              label="Location"
              placeholder="Where will it take place?"
              value={location}
              onChangeText={setLocation}
              error={errors.location}
              leftIcon="location-outline"
            />
            
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.dateTimeText}>
                {format(date, 'MMMM d, yyyy')}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
            
            <Text style={styles.label}>Start Time</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.dateTimeText}>
                {format(time, 'h:mm a')}
              </Text>
            </TouchableOpacity>
            
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
            
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.dateTimeText}>
                {format(endDate, 'MMMM d, yyyy')}
              </Text>
            </TouchableOpacity>
            
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={onEndDateChange}
                minimumDate={date}
              />
            )}
            
            <Text style={styles.label}>End Time</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.dateTimeText}>
                {format(endTime, 'h:mm a')}
              </Text>
            </TouchableOpacity>
            
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                display="default"
                onChange={onEndTimeChange}
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
            
            <Text style={styles.label}>Sport</Text>
            {errors.sportId ? <Text style={styles.errorText}>{errors.sportId}</Text> : null}
            <View style={styles.sportsContainer}>
              {sports.map((sport) => (
                <TouchableOpacity
                  key={sport.id}
                  style={[
                    styles.sportItem,
                    sportId === sport.id && styles.selectedSport
                  ]}
                  onPress={() => setSportId(sport.id)}
                >
                  <Text style={styles.sportIcon}>{sport.icon}</Text>
                  <Text style={[
                    styles.sportName,
                    sportId === sport.id && styles.selectedSportText
                  ]}>
                    {sport.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
                textStyle={styles.cancelButtonText}
                variant="outline"
              />
              <Button
                title="Update Event"
                onPress={handleSubmit}
                style={styles.submitButton}
                disabled={isLoading}
              />
            </View>
          </View>
        </ScrollView>
        
        {(isLoading || isUploadingImage) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>
              {isUploadingImage ? 'Uploading image...' : 'Updating event...'}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  imageContainer: {
    marginHorizontal: 16,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateTimeText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  sportItem: {
    width: '30%',
    marginRight: '3%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  selectedSport: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  sportIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  sportName: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  selectedSportText: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#4B5563',
  },
  submitButton: {
    flex: 2,
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
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 8,
  },
});

export default EditEventScreen; 