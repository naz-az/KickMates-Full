import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../navigation/AppNavigator';

type PrivacyPolicyScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'PrivacyPolicy'>;

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation<PrivacyPolicyScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];
  
  useEffect(() => {
    // Simulate loading privacy policy
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Start entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleEmailSupport = () => {
    Linking.openURL('mailto:privacy@kickmates.com');
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading privacy policy...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Animated.View style={[
          styles.policyContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <View style={styles.policyHeader}>
            <Ionicons name="shield-checkmark" size={32} color="#4F46E5" style={styles.policyIcon} />
            <Text style={styles.policyTitle}>KickMates Privacy Policy</Text>
            <Text style={styles.policyDate}>Last Updated: June 15, 2023</Text>
          </View>
          
          <Text style={styles.policyIntro}>
            At KickMates, we take your privacy seriously. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use our mobile application.
            Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy,
            please do not access the application.
          </Text>
          
          <View style={styles.policySection}>
            <Text style={styles.sectionTitle}>1. Collection of Your Information</Text>
            <Text style={styles.sectionText}>
              We may collect information about you in a variety of ways. The information we may collect via the
              Application includes:
            </Text>
            
            <Text style={styles.subSectionTitle}>Personal Data</Text>
            <Text style={styles.sectionText}>
              While using our application, we may ask you to provide us with certain personally identifiable
              information that can be used to contact or identify you. Personally identifiable information may include,
              but is not limited to:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Name</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Email address</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Phone number</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Date of birth</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Address</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Profile picture</Text>
              </View>
            </View>
            
            <Text style={styles.subSectionTitle}>Geo-Location Information</Text>
            <Text style={styles.sectionText}>
              We may request access or permission to track location-based information from your mobile device, either
              continuously or while you are using the Application, to provide location-based services. If you wish to
              change our access or permissions, you may do so in your device's settings.
            </Text>
            
            <Text style={styles.subSectionTitle}>Mobile Device Access</Text>
            <Text style={styles.sectionText}>
              We may request access or permission to certain features from your mobile device, including your mobile
              device's camera, storage, and other features. If you wish to change our access or permissions, you may
              do so in your device's settings.
            </Text>
          </View>
          
          <View style={styles.policySection}>
            <Text style={styles.sectionTitle}>2. Use of Your Information</Text>
            <Text style={styles.sectionText}>
              Having accurate information about you permits us to provide you with a smooth, efficient, and customized
              experience. Specifically, we may use information collected about you via the Application to:
            </Text>
            
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Create and manage your account.</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Fulfill and manage event registrations and payments.</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Enable user-to-user communications.</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Generate a personal profile about you to make future visits to the Application more personalized.</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Increase the efficiency and operation of the Application.</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Monitor and analyze usage and trends to improve your experience with the Application.</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Notify you of updates to the Application.</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Offer new products, services, and/or recommendations to you.</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.policySection}>
            <Text style={styles.sectionTitle}>3. Disclosure of Your Information</Text>
            <Text style={styles.sectionText}>
              We may share information we have collected about you in certain situations. Your information may be
              disclosed as follows:
            </Text>
            
            <Text style={styles.subSectionTitle}>By Law or to Protect Rights</Text>
            <Text style={styles.sectionText}>
              If we believe the release of information about you is necessary to respond to legal process, to
              investigate or remedy potential violations of our policies, or to protect the rights, property, and
              safety of others, we may share your information as permitted or required by any applicable law, rule,
              or regulation.
            </Text>
            
            <Text style={styles.subSectionTitle}>Third-Party Service Providers</Text>
            <Text style={styles.sectionText}>
              We may share your information with third parties that perform services for us or on our behalf,
              including payment processing, data analysis, email delivery, hosting services, customer service, and
              marketing assistance.
            </Text>
            
            <Text style={styles.subSectionTitle}>Marketing Communications</Text>
            <Text style={styles.sectionText}>
              With your consent, or with an opportunity for you to withdraw consent, we may share your information
              with third parties for marketing purposes, as permitted by law.
            </Text>
          </View>
          
          <View style={styles.policySection}>
            <Text style={styles.sectionTitle}>4. Security of Your Information</Text>
            <Text style={styles.sectionText}>
              We use administrative, technical, and physical security measures to help protect your personal
              information. While we have taken reasonable steps to secure the personal information you provide to us,
              please be aware that despite our efforts, no security measures are perfect or impenetrable, and no
              method of data transmission can be guaranteed against any interception or other type of misuse.
            </Text>
          </View>
          
          <View style={styles.policySection}>
            <Text style={styles.sectionTitle}>5. Contact Us</Text>
            <Text style={styles.sectionText}>
              If you have questions or comments about this Privacy Policy, please contact us at:
            </Text>
            
            <TouchableOpacity style={styles.contactButton} onPress={handleEmailSupport}>
              <Ionicons name="mail" size={20} color="#4F46E5" />
              <Text style={styles.contactButtonText}>privacy@kickmates.com</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
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
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
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
  policyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  policyHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  policyIcon: {
    marginBottom: 8,
  },
  policyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  policyDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  policyIntro: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 20,
  },
  policySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  bulletList: {
    marginLeft: 8,
    marginBottom: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4F46E5',
    marginTop: 8,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4F46E5',
    marginLeft: 8,
  },
});

export default PrivacyPolicyScreen; 