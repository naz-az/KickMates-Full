import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Animated,
  SafeAreaView,
  Linking,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../navigation/AppNavigator';

type HelpCenterScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'HelpCenter'>;

// FAQ item type
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// FAQ category type
interface FAQCategory {
  id: string;
  name: string;
  icon: string;
}

const HelpCenterScreen = () => {
  const navigation = useNavigation<HelpCenterScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];
  
  // Search input ref for focusing
  const searchInputRef = useRef<TextInput>(null);
  
  // FAQ categories
  const categories: FAQCategory[] = [
    { id: 'account', name: 'Account', icon: 'person-circle-outline' },
    { id: 'events', name: 'Events', icon: 'calendar-outline' },
    { id: 'payments', name: 'Payments', icon: 'card-outline' },
    { id: 'app', name: 'App Features', icon: 'apps-outline' },
    { id: 'privacy', name: 'Privacy', icon: 'shield-checkmark-outline' },
  ];
  
  // FAQ data (would typically come from an API)
  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'How do I create an account?',
      answer: 'To create an account, download the KickMates app from the App Store or Google Play Store. Open the app and tap "Sign Up". Follow the on-screen instructions to complete your registration.',
      category: 'account',
    },
    {
      id: '2',
      question: 'How do I reset my password?',
      answer: 'You can reset your password by tapping "Forgot Password" on the login screen. Enter your email address, and we will send you a link to reset your password.',
      category: 'account',
    },
    {
      id: '3',
      question: 'How do I update my profile information?',
      answer: 'To update your profile, go to the Settings screen, tap "Edit Profile", and make your desired changes. Don\'t forget to save your changes when you\'re done.',
      category: 'account',
    },
    {
      id: '4',
      question: 'How do I create an event?',
      answer: 'To create an event, go to the Events tab and tap the "+" button. Fill out the event details, including title, date, time, location, and description. You can also add images and set event preferences.',
      category: 'events',
    },
    {
      id: '5',
      question: 'How do I join an event?',
      answer: 'To join an event, browse events in the Events tab or search for a specific event. Tap on the event you want to join, and then tap the "Join" button on the event details screen.',
      category: 'events',
    },
    {
      id: '6',
      question: 'Can I edit or cancel an event I created?',
      answer: 'Yes, you can edit or cancel events you created. Go to the event details screen and tap the "Edit" button to modify event details. To cancel, tap the "Cancel Event" option in the event settings.',
      category: 'events',
    },
    {
      id: '7',
      question: 'What payment methods are accepted?',
      answer: 'We accept major credit and debit cards, including Visa, Mastercard, American Express, and Discover. We also support PayPal, Apple Pay, and Google Pay depending on your device.',
      category: 'payments',
    },
    {
      id: '8',
      question: 'How do I add a payment method?',
      answer: 'To add a payment method, go to Settings, tap "Payment Methods", and then tap "Add Payment Method". Follow the instructions to securely add your preferred payment option.',
      category: 'payments',
    },
    {
      id: '9',
      question: 'Are my payment details secure?',
      answer: 'Yes, your payment information is encrypted and securely stored. We do not store your complete card details on our servers. All payments are processed through secure payment gateways.',
      category: 'payments',
    },
    {
      id: '10',
      question: 'How do I enable location services?',
      answer: 'To enable location services, go to your device settings, find KickMates in the app list, tap on "Location", and select "While Using the App" or "Always" depending on your preference.',
      category: 'app',
    },
    {
      id: '11',
      question: 'How do I use the chat feature?',
      answer: 'To use the chat feature, go to the Messages tab. You can chat with individual users or participate in event group chats. Tap on a conversation to open it and start messaging.',
      category: 'app',
    },
    {
      id: '12',
      question: 'How do I customize my notifications?',
      answer: 'To customize notifications, go to Settings and tap "Notifications". You can toggle different types of notifications on or off according to your preferences.',
      category: 'app',
    },
    {
      id: '13',
      question: 'Who can see my profile information?',
      answer: 'By default, your basic profile information is visible to other KickMates users. You can adjust your privacy settings in the Settings menu under "Privacy" to control who can see your profile and activity.',
      category: 'privacy',
    },
    {
      id: '14',
      question: 'How do I delete my account?',
      answer: 'To delete your account, go to Settings, scroll down to the bottom, and tap "Delete Account". Please note that this action is permanent and cannot be undone.',
      category: 'account',
    },
    {
      id: '15',
      question: 'How does KickMates use my data?',
      answer: 'KickMates collects and uses your data as described in our Privacy Policy. We use your information to provide and improve our services, personalize your experience, and communicate with you.',
      category: 'privacy',
    },
  ];
  
  useEffect(() => {
    // Simulate loading data
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
      
      // Set the default active category
      setActiveCategory('account');
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // When searching, we don't filter by category
    if (text) {
      setActiveCategory(null);
    } else {
      setActiveCategory('account');
    }
  };
  
  const handleCategoryPress = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSearchQuery('');
  };
  
  const handleFAQPress = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };
  
  const handleContactSupport = () => {
    Linking.openURL('mailto:support@kickmates.com');
  };
  
  const handleOpenChat = () => {
    Alert.alert('Live Chat', 'Live chat support is coming soon!');
  };
  
  // Filter FAQs based on search or category
  const filteredFAQs = searchQuery
    ? faqData.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeCategory
    ? faqData.filter((faq) => faq.category === activeCategory)
    : faqData;
  
  const windowWidth = Dimensions.get('window').width;
  const categoryWidth = (windowWidth - 32) / Math.min(categories.length, 5);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading help center...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Animated.View
          style={[
            styles.searchContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.searchTitle}>How can we help you?</Text>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search for help..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>
        
        <Animated.View
          style={[
            styles.categoriesContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  activeCategory === category.id && styles.activeCategoryButton,
                  { width: categoryWidth - 16 },
                ]}
                onPress={() => handleCategoryPress(category.id)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={24}
                  color={activeCategory === category.id ? "#FFFFFF" : "#4F46E5"}
                  style={styles.categoryIcon}
                />
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === category.id && styles.activeCategoryText,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
        
        <Animated.View
          style={[
            styles.faqContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.faqTitle}>
            {searchQuery
              ? `Search Results (${filteredFAQs.length})`
              : activeCategory
              ? `${categories.find((c) => c.id === activeCategory)?.name} FAQs`
              : 'Frequently Asked Questions'}
          </Text>
          
          {filteredFAQs.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={64} color="#D1D5DB" />
              <Text style={styles.noResultsText}>No results found</Text>
              <Text style={styles.noResultsSubtext}>
                Try different keywords or browse by category
              </Text>
            </View>
          ) : (
            filteredFAQs.map((faq) => (
              <View key={faq.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => handleFAQPress(faq.id)}
                >
                  <Text style={styles.questionText}>{faq.question}</Text>
                  <Ionicons
                    name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
                {expandedFAQ === faq.id && (
                  <Text style={styles.answerText}>{faq.answer}</Text>
                )}
              </View>
            ))
          )}
        </Animated.View>
        
        <Animated.View
          style={[
            styles.supportContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.supportTitle}>Still need help?</Text>
          <View style={styles.supportButtonsContainer}>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={handleContactSupport}
            >
              <Ionicons name="mail-outline" size={24} color="#4F46E5" style={styles.supportButtonIcon} />
              <Text style={styles.supportButtonText}>Email Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={handleOpenChat}
            >
              <Ionicons name="chatbubbles-outline" size={24} color="#4F46E5" style={styles.supportButtonIcon} />
              <Text style={styles.supportButtonText}>Live Chat</Text>
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
  searchContainer: {
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
  searchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesScrollContent: {
    paddingHorizontal: 8,
  },
  categoryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activeCategoryButton: {
    backgroundColor: '#4F46E5',
  },
  categoryIcon: {
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5',
    textAlign: 'center',
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  faqContainer: {
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
  faqTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    paddingRight: 8,
  },
  answerText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginTop: 8,
    paddingLeft: 4,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  supportContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  supportButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  supportButton: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  supportButtonIcon: {
    marginBottom: 8,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
  },
});

export default HelpCenterScreen; 