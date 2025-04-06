import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../navigation/AppNavigator';
import { getPaymentMethods, deletePaymentMethod, setDefaultPaymentMethod } from '../services/api';

type PaymentMethodsScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'PaymentMethods'>;

// Types for payment methods
interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  expMonth?: number;
  expYear?: number;
  cardBrand?: string;
  isDefault: boolean;
  email?: string;
}

const PaymentMethodsScreen = () => {
  const navigation = useNavigation<PaymentMethodsScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];
  
  useEffect(() => {
    loadPaymentMethods();
    
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
  }, []);
  
  const loadPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const response = await getPaymentMethods();
      setPaymentMethods(response.data.paymentMethods);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      Alert.alert('Error', 'Failed to load your payment methods. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddPaymentMethod = () => {
    // Navigate to add payment method screen (to be implemented)
    Alert.alert('Feature Coming Soon', 'Adding new payment methods will be available in the next update.');
  };
  
  const handleSetDefault = async (id: string) => {
    setIsProcessing(true);
    try {
      await setDefaultPaymentMethod(id);
      
      // Update local state
      const updatedMethods = paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === id,
      }));
      
      setPaymentMethods(updatedMethods);
      Alert.alert('Success', 'Default payment method updated.');
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      Alert.alert('Error', 'Failed to update your default payment method. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeletePaymentMethod = (id: string) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: async () => {
            setIsProcessing(true);
            try {
              await deletePaymentMethod(id);
              
              // Update local state
              const updatedMethods = paymentMethods.filter(method => method.id !== id);
              setPaymentMethods(updatedMethods);
              
            } catch (error) {
              console.error('Failed to delete payment method:', error);
              Alert.alert('Error', 'Failed to remove payment method. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };
  
  const getCardImage = (cardBrand?: string) => {
    switch (cardBrand?.toLowerCase()) {
      case 'visa':
        return require('../assets/images/visa.png');
      case 'mastercard':
        return require('../assets/images/mastercard.png');
      case 'amex':
        return require('../assets/images/amex.png');
      case 'discover':
        return require('../assets/images/discover.png');
      default:
        return require('../assets/images/card-generic.png');
    }
  };
  
  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'paypal':
        return 'logo-paypal';
      case 'apple_pay':
        return 'logo-apple';
      case 'google_pay':
        return 'logo-google';
      default:
        return 'card-outline';
    }
  };
  
  const formatExpirationDate = (month?: number, year?: number) => {
    if (!month || !year) return '';
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading payment methods...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {paymentMethods.length === 0 ? (
          <Animated.View 
            style={[
              styles.emptyContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <Ionicons name="card-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Payment Methods</Text>
            <Text style={styles.emptyText}>
              You haven't added any payment methods yet. Add a credit card or other payment method to easily pay for event registrations and purchases.
            </Text>
          </Animated.View>
        ) : (
          <Animated.View 
            style={[
              styles.paymentMethodsContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <Text style={styles.sectionTitle}>Your Payment Methods</Text>
            
            {paymentMethods.map((method, index) => (
              <Animated.View 
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  index === paymentMethods.length - 1 && { marginBottom: 0 }
                ]}
              >
                {method.type === 'credit_card' ? (
                  <View style={styles.cardDetails}>
                    <Image source={getCardImage(method.cardBrand)} style={styles.cardImage} />
                    <View style={styles.cardInfo}>
                      <View style={styles.cardNumberRow}>
                        <Text style={styles.cardNumberText}>•••• •••• •••• {method.last4}</Text>
                        {method.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cardExpiryText}>
                        Expires {formatExpirationDate(method.expMonth, method.expYear)}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.cardDetails}>
                    <View style={[styles.iconContainer, method.type === 'paypal' && styles.paypalIcon]}>
                      <Ionicons name={getPaymentMethodIcon(method.type)} size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.cardInfo}>
                      <View style={styles.cardNumberRow}>
                        <Text style={styles.cardNumberText}>
                          {method.type === 'paypal' ? 'PayPal' : method.type === 'apple_pay' ? 'Apple Pay' : 'Google Pay'}
                        </Text>
                        {method.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cardExpiryText}>
                        {method.email || ''}
                      </Text>
                    </View>
                  </View>
                )}
                
                <View style={styles.cardActions}>
                  {!method.isDefault && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(method.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color="#4F46E5" />
                      <Text style={styles.actionButtonText}>Set Default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeletePaymentMethod(method.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddPaymentMethod}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </TouchableOpacity>
      </View>
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
  processingOverlay: {
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
  processingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
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
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  paymentMethodsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 16,
  },
  paymentMethodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardImage: {
    width: 48,
    height: 32,
    resizeMode: 'contain',
    marginRight: 16,
  },
  iconContainer: {
    width: 48,
    height: 32,
    backgroundColor: '#4F46E5',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  paypalIcon: {
    backgroundColor: '#003087',
  },
  cardInfo: {
    flex: 1,
  },
  cardNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardNumberText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  defaultBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5',
  },
  cardExpiryText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
    marginLeft: 4,
  },
  deleteButton: {
    marginRight: 0,
  },
  deleteButtonText: {
    color: '#EF4444',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    height: 48,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default PaymentMethodsScreen; 