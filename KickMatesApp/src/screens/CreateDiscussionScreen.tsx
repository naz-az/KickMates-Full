import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import { createDiscussion } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const CATEGORIES = [
  'Basketball',
  'Football',
  'Soccer',
  'Tennis',
  'Running',
  'Swimming',
  'Cycling',
  'Yoga',
  'Fitness',
  'Other'
];

const CreateDiscussionScreen = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigation.replace('Login');
    }
  }, [user, navigation]);
  
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return false;
    }
    
    if (!content.trim()) {
      Alert.alert('Error', 'Content is required');
      return false;
    }
    
    if (!category) {
      Alert.alert('Error', 'Category is required');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      // Create form data for image upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('category', category);
      
      if (image) {
        const filename = image.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('image', {
          uri: image,
          name: filename,
          type,
        } as any);
      }
      
      const response = await createDiscussion(formData);
      
      Alert.alert(
        'Success',
        'Discussion created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('DiscussionDetail', { discussionId: response.data.discussion.id }),
          },
        ]
      );
    } catch (err) {
      console.error('Error creating discussion:', err);
      Alert.alert('Error', 'Failed to create discussion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const removeImage = () => {
    setImage(null);
  };
  
  const toggleCategoryPicker = () => {
    setShowCategoryPicker(!showCategoryPicker);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
                style={styles.gradientContainer}
              >
                <Text style={styles.headerTitle}>Create Discussion</Text>
              </LinearGradient>
            </View>
          </View>
          
          {/* Form */}
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter discussion title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity 
                style={styles.categorySelector}
                onPress={toggleCategoryPicker}
              >
                <Text style={category ? styles.categoryText : styles.categoryPlaceholder}>
                  {category || 'Select a category'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
              
              {showCategoryPicker && (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={category}
                    onValueChange={(itemValue) => {
                      setCategory(itemValue);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Picker.Item label="Select a category" value="" />
                    {CATEGORIES.map((cat) => (
                      <Picker.Item key={cat} label={cat} value={cat} />
                    ))}
                  </Picker>
                </View>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Content</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Write your discussion content here..."
                value={content}
                onChangeText={setContent}
                multiline
                placeholderTextColor="#9CA3AF"
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Image (Optional)</Text>
              
              {image ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: image }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                  <Ionicons name="image-outline" size={24} color="#6B7280" />
                  <Text style={styles.imagePickerText}>Tap to upload an image</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <Button
              title="Create Discussion"
              onPress={handleSubmit}
              disabled={isSubmitting}
              icon={isSubmitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  gradientContainer: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  categorySelector: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    fontSize: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 16,
    color: '#111827',
  },
  categoryPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 150,
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
  },
  submitButton: {
    marginTop: 8,
  },
});

export default CreateDiscussionScreen; 