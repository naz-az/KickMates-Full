import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../navigation/AppNavigator';
import { sendContactForm } from '../services/api';

type ContactUsScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ContactUs'>;

interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactUsScreen = () => {
  const navigation = useNavigation<ContactUsScreenNavigationProp>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  
  // Contact form state
  const [contactForm, setContactForm] = useState<ContactMessage>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  
  // Predefined subjects
  const subjects = [
    { id: 'general', label: 'General Inquiry' },
    { id: 'support', label: 'Technical Support' },
    { id: 'feedback', label: 'Feedback & Suggestions' },
    { id: 'partnership', label: 'Partnership Opportunity' },
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
  
  const handleSubjectSelect = (subject: string) => {
    setContactForm({ ...contactForm, subject });
  };
  
  const handleSubmitContact = async () => {
    // Validation
    if (!contactForm.name.trim()) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }
    
    if (!contactForm.email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    
    // Email validation with regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email)) {
      Alert.alert('Error', 'Please provide a valid email address.');
      return;
    }
    
    if (!contactForm.subject) {
      Alert.alert('Error', 'Please select a subject for your message.');
      return;
    }
    
    if (!contactForm.message.trim() || contactForm.message.trim().length < 10) {
      Alert.alert('Error', 'Please enter a message with at least 10 characters.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Submit message to API
      await sendContactForm(contactForm);
      
      Alert.alert(
        'Message Sent',
        'Thank you for contacting us. We will get back to you as soon as possible.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send your message. Please try again later or use one of our alternative contact methods.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEmailPress = () => {
    Linking.openURL('mailto:hello@kickmates.com');
  };
  
  const handlePhonePress = () => {
    Linking.openURL('tel:+18001234567');
  };
  
  const handleLocationPress = () => {
    Linking.openURL('https://maps.google.com/?q=123+Startup+Street,+San+Francisco,+CA+94107');
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
          <Text style={styles.headerTitle}>Contact Us</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <Animated.View 
            style={[
              styles.contactInfoContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <Text style={styles.contactTitle}>Get in Touch</Text>
            <Text style={styles.contactDescription}>
              Have questions, feedback, or need assistance? We're here to help! Fill out the form below or reach out using your preferred contact method.
            </Text>
            
            <View style={styles.contactMethodsContainer}>
              <TouchableOpacity style={styles.contactMethod} onPress={handleEmailPress}>
                <View style={styles.contactMethodIcon}>
                  <Ionicons name="mail" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.contactMethodInfo}>
                  <Text style={styles.contactMethodLabel}>Email</Text>
                  <Text style={styles.contactMethodValue}>hello@kickmates.com</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.contactMethod} onPress={handlePhonePress}>
                <View style={[styles.contactMethodIcon, styles.phoneIcon]}>
                  <Ionicons name="call" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.contactMethodInfo}>
                  <Text style={styles.contactMethodLabel}>Phone</Text>
                  <Text style={styles.contactMethodValue}>+1 (800) 123-4567</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.contactMethod} onPress={handleLocationPress}>
                <View style={[styles.contactMethodIcon, styles.locationIcon]}>
                  <Ionicons name="location" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.contactMethodInfo}>
                  <Text style={styles.contactMethodLabel}>Office</Text>
                  <Text style={styles.contactMethodValue}>123 Startup Street, San Francisco</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.formContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <Text style={styles.formTitle}>Send a Message</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Name*</Text>
              <TextInput
                style={styles.input}
                value={contactForm.name}
                onChangeText={(text) => setContactForm({ ...contactForm, name: text })}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Email*</Text>
              <TextInput
                style={styles.input}
                value={contactForm.email}
                onChangeText={(text) => setContactForm({ ...contactForm, email: text })}
                placeholder="Enter your email address"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Subject*</Text>
              <View style={styles.subjectsContainer}>
                {subjects.map((subject) => (
                  <TouchableOpacity
                    key={subject.id}
                    style={[
                      styles.subjectButton,
                      contactForm.subject === subject.id && styles.activeSubjectButton,
                    ]}
                    onPress={() => handleSubjectSelect(subject.id)}
                  >
                    <Text 
                      style={[
                        styles.subjectButtonText, 
                        contactForm.subject === subject.id && styles.activeSubjectButtonText
                      ]}
                    >
                      {subject.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Message*</Text>
              <TextInput
                style={styles.textArea}
                value={contactForm.message}
                onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
                placeholder="Enter your message here..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
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
            onPress={handleSubmitContact}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Send Message</Text>
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
  contactInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  contactDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  contactMethodsContainer: {
    marginTop: 8,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  contactMethodIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  phoneIcon: {
    backgroundColor: '#10B981',
  },
  locationIcon: {
    backgroundColor: '#F59E0B',
  },
  contactMethodInfo: {
    flex: 1,
  },
  contactMethodLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  contactMethodValue: {
    fontSize: 14,
    color: '#1F2937',
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
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
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
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  subjectButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  activeSubjectButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  subjectButtonText: {
    fontSize: 14,
    color: '#4B5563',
  },
  activeSubjectButtonText: {
    color: '#4F46E5',
    fontWeight: '500',
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

export default ContactUsScreen; 