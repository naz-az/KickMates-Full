import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../navigation/AppNavigator';
import { reportProblem } from '../services/api';

type ReportProblemScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ReportProblem'>;

interface ProblemReport {
  category: string;
  description: string;
  screenshots: string[];
  email: string;
}

const ReportProblemScreen = () => {
  const navigation = useNavigation<ReportProblemScreenNavigationProp>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  
  // Report state
  const [report, setReport] = useState<ProblemReport>({
    category: '',
    description: '',
    screenshots: [],
    email: '',
  });
  
  // Problem categories
  const categories = [
    { id: 'account', label: 'Account Issues' },
    { id: 'app', label: 'App Functionality' },
    { id: 'events', label: 'Events' },
    { id: 'payments', label: 'Payments' },
    { id: 'other', label: 'Other' },
  ];
  
  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleCategorySelect = (category: string) => {
    setReport({ ...report, category });
  };
  
  const handleAddScreenshot = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your media library.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 3 - report.screenshots.length,
      });
      
      if (!result.canceled && result.assets.length > 0) {
        const newScreenshots = result.assets.map(asset => asset.uri);
        
        if (report.screenshots.length + newScreenshots.length > 3) {
          Alert.alert('Too Many Images', 'You can only upload up to 3 screenshots.');
          return;
        }
        
        setReport({
          ...report,
          screenshots: [...report.screenshots, ...newScreenshots],
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const handleRemoveScreenshot = (index: number) => {
    const updatedScreenshots = [...report.screenshots];
    updatedScreenshots.splice(index, 1);
    setReport({ ...report, screenshots: updatedScreenshots });
  };
  
  const handleSubmitReport = async () => {
    // Validation
    if (!report.category) {
      Alert.alert('Error', 'Please select a problem category.');
      return;
    }
    
    if (!report.description || report.description.trim().length < 10) {
      Alert.alert('Error', 'Please provide a detailed description of the problem (at least 10 characters).');
      return;
    }
    
    if (!report.email) {
      Alert.alert('Error', 'Please provide your email address for us to contact you.');
      return;
    }
    
    // Email validation with regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(report.email)) {
      Alert.alert('Error', 'Please provide a valid email address.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Submit report to API
      await reportProblem(report);
      
      Alert.alert(
        'Report Submitted',
        'Thank you for your feedback. We will review your report and respond via email if necessary.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Failed to submit report:', error);
      Alert.alert('Error', 'Failed to submit your report. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report a Problem</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <Animated.View 
            style={[
              styles.formContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={24} color="#4F46E5" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Please provide detailed information about the problem you're experiencing. This will help us resolve it more quickly.
              </Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Problem Category*</Text>
              <View style={styles.categoriesContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      report.category === category.id && styles.activeCategoryButton,
                    ]}
                    onPress={() => handleCategorySelect(category.id)}
                  >
                    <Text 
                      style={[
                        styles.categoryButtonText, 
                        report.category === category.id && styles.activeCategoryButtonText
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description*</Text>
              <TextInput
                style={styles.textArea}
                value={report.description}
                onChangeText={(text) => setReport({ ...report, description: text })}
                placeholder="Please describe the problem in detail. Include what you were doing when it occurred, any error messages you saw, and steps to reproduce the issue."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Screenshots (Optional - max 3)</Text>
              <Text style={styles.helperText}>
                Add screenshots to help us understand the problem better
              </Text>
              
              <View style={styles.screenshotsContainer}>
                {report.screenshots.map((screenshot, index) => (
                  <View key={index} style={styles.screenshotWrapper}>
                    <Image source={{ uri: screenshot }} style={styles.screenshotImage} />
                    <TouchableOpacity
                      style={styles.removeScreenshotButton}
                      onPress={() => handleRemoveScreenshot(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {report.screenshots.length < 3 && (
                  <TouchableOpacity 
                    style={styles.addScreenshotButton}
                    onPress={handleAddScreenshot}
                  >
                    <Ionicons name="add" size={32} color="#6B7280" />
                    <Text style={styles.addScreenshotText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Email*</Text>
              <TextInput
                style={styles.input}
                value={report.email}
                onChangeText={(text) => setReport({ ...report, email: text })}
                placeholder="Enter your email address"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.helperText}>
                We'll use this to contact you if we need more information
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitReport}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4F46E5',
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    height: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  activeCategoryButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#4B5563',
  },
  activeCategoryButtonText: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  screenshotsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  screenshotWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  screenshotImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeScreenshotButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addScreenshotButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addScreenshotText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
  },
  submitButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default ReportProblemScreen; 