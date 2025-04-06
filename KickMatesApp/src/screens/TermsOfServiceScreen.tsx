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

type TermsOfServiceScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'TermsOfService'>;

const TermsOfServiceScreen = () => {
  const navigation = useNavigation<TermsOfServiceScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];
  
  // Section animation values (for accordion effect)
  const sectionAnimations = [0, 1, 2, 3, 4, 5, 6].map(() => 
    useState(new Animated.Value(0))[0]
  );
  
  useEffect(() => {
    // Simulate loading terms
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
  
  const toggleSection = (sectionIndex: number) => {
    // If this section is already open, close it
    if (activeSection === sectionIndex) {
      Animated.timing(sectionAnimations[sectionIndex], {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setActiveSection(null);
    } else {
      // If another section is open, close it
      if (activeSection !== null) {
        Animated.timing(sectionAnimations[activeSection], {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
      
      // Open the selected section
      setActiveSection(sectionIndex);
      Animated.timing(sectionAnimations[sectionIndex], {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };
  
  const handleEmailSupport = () => {
    Linking.openURL('mailto:terms@kickmates.com');
  };
  
  const getSectionMaxHeight = (sectionIndex: number) => {
    const heights = [300, 400, 350, 250, 300, 400, 200]; // Approximate heights for each section content
    return sectionAnimations[sectionIndex].interpolate({
      inputRange: [0, 1],
      outputRange: [0, heights[sectionIndex]],
    });
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading terms of service...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Animated.View style={[
          styles.termsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <View style={styles.termsHeader}>
            <Ionicons name="document-text" size={32} color="#4F46E5" style={styles.termsIcon} />
            <Text style={styles.termsTitle}>KickMates Terms of Service</Text>
            <Text style={styles.termsDate}>Last Updated: June 15, 2023</Text>
          </View>
          
          <Text style={styles.termsIntro}>
            Welcome to KickMates. Please read these Terms of Service carefully before using the KickMates mobile application.
            By accessing or using our application, you agree to be bound by these Terms and our Privacy Policy.
          </Text>
          
          {/* Section 1: Acceptance of Terms */}
          <View style={styles.sectionWrapper}>
            <TouchableOpacity 
              style={[
                styles.sectionHeader, 
                activeSection === 0 && styles.activeSectionHeader
              ]} 
              onPress={() => toggleSection(0)}
            >
              <Text style={[
                styles.sectionTitle, 
                activeSection === 0 && styles.activeSectionTitle
              ]}>
                1. Acceptance of Terms
              </Text>
              <Ionicons 
                name={activeSection === 0 ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={activeSection === 0 ? "#4F46E5" : "#6B7280"} 
              />
            </TouchableOpacity>
            
            <Animated.View style={[
              styles.sectionContent,
              { maxHeight: getSectionMaxHeight(0) }
            ]}>
              <Text style={styles.sectionText}>
                By accessing or using the KickMates application, you agree to be bound by these Terms of Service and all applicable
                laws and regulations. If you do not agree with any part of these terms, you may not use our service.
              </Text>
              <Text style={styles.sectionText}>
                We may update these Terms at any time. Your continued use of the application after any modifications
                confirms your acceptance of the revised Terms.
              </Text>
            </Animated.View>
          </View>
          
          {/* Section 2: Account Registration */}
          <View style={styles.sectionWrapper}>
            <TouchableOpacity 
              style={[
                styles.sectionHeader, 
                activeSection === 1 && styles.activeSectionHeader
              ]} 
              onPress={() => toggleSection(1)}
            >
              <Text style={[
                styles.sectionTitle, 
                activeSection === 1 && styles.activeSectionTitle
              ]}>
                2. Account Registration
              </Text>
              <Ionicons 
                name={activeSection === 1 ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={activeSection === 1 ? "#4F46E5" : "#6B7280"} 
              />
            </TouchableOpacity>
            
            <Animated.View style={[
              styles.sectionContent,
              { maxHeight: getSectionMaxHeight(1) }
            ]}>
              <Text style={styles.sectionText}>
                To use certain features of our application, you must register for an account. You agree to provide
                accurate, current, and complete information during the registration process and to update such
                information to keep it accurate, current, and complete.
              </Text>
              <Text style={styles.sectionText}>
                You are responsible for maintaining the confidentiality of your account information, including your
                password, and for all activity that occurs under your account. You agree to notify us immediately of
                any unauthorized use of your account.
              </Text>
              <Text style={styles.sectionText}>
                We reserve the right to suspend or terminate your account if any information provided during the
                registration process or thereafter proves to be inaccurate, not current, or incomplete.
              </Text>
            </Animated.View>
          </View>
          
          {/* Section 3: User Content */}
          <View style={styles.sectionWrapper}>
            <TouchableOpacity 
              style={[
                styles.sectionHeader, 
                activeSection === 2 && styles.activeSectionHeader
              ]} 
              onPress={() => toggleSection(2)}
            >
              <Text style={[
                styles.sectionTitle, 
                activeSection === 2 && styles.activeSectionTitle
              ]}>
                3. User Content
              </Text>
              <Ionicons 
                name={activeSection === 2 ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={activeSection === 2 ? "#4F46E5" : "#6B7280"} 
              />
            </TouchableOpacity>
            
            <Animated.View style={[
              styles.sectionContent,
              { maxHeight: getSectionMaxHeight(2) }
            ]}>
              <Text style={styles.sectionText}>
                Our application allows you to post, link, store, share and otherwise make available certain information,
                text, graphics, videos, or other material. You are responsible for the content that you post,
                including its legality, reliability, and appropriateness.
              </Text>
              <Text style={styles.sectionText}>
                By posting content, you grant us the right to use, modify, publicly perform, publicly display, reproduce,
                and distribute such content on and through the application. You retain any and all of your rights to any
                content you submit and are responsible for protecting those rights.
              </Text>
              <Text style={styles.sectionText}>
                You represent and warrant that: (1) the content is yours or you have the right to use it and grant us the
                rights and license as provided in these Terms, and (2) the posting of your content does not violate the
                privacy rights, publicity rights, copyrights, contract rights or any other rights of any person.
              </Text>
            </Animated.View>
          </View>
          
          {/* Section 4: Prohibited Activities */}
          <View style={styles.sectionWrapper}>
            <TouchableOpacity 
              style={[
                styles.sectionHeader, 
                activeSection === 3 && styles.activeSectionHeader
              ]} 
              onPress={() => toggleSection(3)}
            >
              <Text style={[
                styles.sectionTitle, 
                activeSection === 3 && styles.activeSectionTitle
              ]}>
                4. Prohibited Activities
              </Text>
              <Ionicons 
                name={activeSection === 3 ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={activeSection === 3 ? "#4F46E5" : "#6B7280"} 
              />
            </TouchableOpacity>
            
            <Animated.View style={[
              styles.sectionContent,
              { maxHeight: getSectionMaxHeight(3) }
            ]}>
              <Text style={styles.sectionText}>
                You may not access or use the application for any purpose other than that for which we make it available.
                The application may not be used in connection with any commercial endeavors except those that are
                specifically endorsed or approved by us.
              </Text>
              <Text style={styles.sectionText}>
                Prohibited activities include but are not limited to:
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Using the application for any illegal purpose or to violate any local, state, national, or international law</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Harassing, abusing, or harming another person</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Creating a false identity for the purpose of misleading others</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Attempting to circumvent any security measures of the application</Text>
                </View>
              </View>
            </Animated.View>
          </View>
          
          {/* Section 5: Intellectual Property */}
          <View style={styles.sectionWrapper}>
            <TouchableOpacity 
              style={[
                styles.sectionHeader, 
                activeSection === 4 && styles.activeSectionHeader
              ]} 
              onPress={() => toggleSection(4)}
            >
              <Text style={[
                styles.sectionTitle, 
                activeSection === 4 && styles.activeSectionTitle
              ]}>
                5. Intellectual Property
              </Text>
              <Ionicons 
                name={activeSection === 4 ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={activeSection === 4 ? "#4F46E5" : "#6B7280"} 
              />
            </TouchableOpacity>
            
            <Animated.View style={[
              styles.sectionContent,
              { maxHeight: getSectionMaxHeight(4) }
            ]}>
              <Text style={styles.sectionText}>
                The application and its original content, features, and functionality are and will remain the exclusive
                property of KickMates and its licensors. The application is protected by copyright, trademark, and other
                laws of both the United States and foreign countries.
              </Text>
              <Text style={styles.sectionText}>
                Our trademarks and trade dress may not be used in connection with any product or service without the prior
                written consent of KickMates.
              </Text>
            </Animated.View>
          </View>
          
          {/* Section 6: Limitation of Liability */}
          <View style={styles.sectionWrapper}>
            <TouchableOpacity 
              style={[
                styles.sectionHeader, 
                activeSection === 5 && styles.activeSectionHeader
              ]} 
              onPress={() => toggleSection(5)}
            >
              <Text style={[
                styles.sectionTitle, 
                activeSection === 5 && styles.activeSectionTitle
              ]}>
                6. Limitation of Liability
              </Text>
              <Ionicons 
                name={activeSection === 5 ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={activeSection === 5 ? "#4F46E5" : "#6B7280"} 
              />
            </TouchableOpacity>
            
            <Animated.View style={[
              styles.sectionContent,
              { maxHeight: getSectionMaxHeight(5) }
            ]}>
              <Text style={styles.sectionText}>
                In no event shall KickMates, nor its directors, employees, partners, agents, suppliers, or affiliates, be
                liable for any indirect, incidental, special, consequential or punitive damages, including without
                limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Your access to or use of or inability to access or use the application</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Any conduct or content of any third party on the application</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Any content obtained from the application</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Unauthorized access, use or alteration of your transmissions or content</Text>
                </View>
              </View>
            </Animated.View>
          </View>
          
          {/* Section 7: Contact Us */}
          <View style={styles.sectionWrapper}>
            <TouchableOpacity 
              style={[
                styles.sectionHeader, 
                activeSection === 6 && styles.activeSectionHeader
              ]} 
              onPress={() => toggleSection(6)}
            >
              <Text style={[
                styles.sectionTitle, 
                activeSection === 6 && styles.activeSectionTitle
              ]}>
                7. Contact Us
              </Text>
              <Ionicons 
                name={activeSection === 6 ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={activeSection === 6 ? "#4F46E5" : "#6B7280"} 
              />
            </TouchableOpacity>
            
            <Animated.View style={[
              styles.sectionContent,
              { maxHeight: getSectionMaxHeight(6) }
            ]}>
              <Text style={styles.sectionText}>
                If you have any questions about these Terms, please contact us at:
              </Text>
              <TouchableOpacity style={styles.contactButton} onPress={handleEmailSupport}>
                <Ionicons name="mail" size={20} color="#4F46E5" />
                <Text style={styles.contactButtonText}>terms@kickmates.com</Text>
              </TouchableOpacity>
            </Animated.View>
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
  termsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  termsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  termsIcon: {
    marginBottom: 8,
  },
  termsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  termsDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  termsIntro: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 20,
  },
  sectionWrapper: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  activeSectionHeader: {
    backgroundColor: '#EEF2FF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  activeSectionTitle: {
    color: '#4F46E5',
  },
  sectionContent: {
    overflow: 'hidden',
  },
  sectionText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bulletList: {
    marginLeft: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
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
    marginHorizontal: 16,
    marginBottom: 16,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4F46E5',
    marginLeft: 8,
  },
});

export default TermsOfServiceScreen; 