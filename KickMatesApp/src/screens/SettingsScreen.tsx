import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { getUserSettings, updateUserSettings, deleteAccount } from '../services/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../navigation/AppNavigator';

type SettingsScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface UserSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  eventReminders: boolean;
  messageNotifications: boolean;
  darkMode: boolean;
  privateProfile: boolean;
  showDistance: boolean;
  locationSharing: boolean;
  units: 'metric' | 'imperial';
}

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { logout } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    pushNotifications: true,
    emailNotifications: true,
    eventReminders: true,
    messageNotifications: true,
    darkMode: false,
    privateProfile: false,
    showDistance: true,
    locationSharing: true,
    units: 'metric', // 'metric' or 'imperial'
  });
  
  // Load settings from API/AsyncStorage
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Try to load from AsyncStorage first for faster initial load
      const storedSettings = await AsyncStorage.getItem('userSettings');
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
      
      // Then fetch from API to ensure up-to-date data
      const response = await getUserSettings();
      const serverSettings = response.data.settings;
      
      setSettings(serverSettings);
      await AsyncStorage.setItem('userSettings', JSON.stringify(serverSettings));
    } catch (error) {
      console.error('Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load your settings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleSetting = async (key: keyof UserSettings, value: boolean | string) => {
    // Update locally first for immediate feedback
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings as UserSettings);
    
    // Save to server in background
    try {
      await updateUserSettings({ [key]: value });
      await AsyncStorage.setItem('userSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to update setting:', error);
      // Revert the setting if server update failed
      setSettings(settings);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled by the AuthContext
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => confirmDeleteAccount()
        }
      ]
    );
  };
  
  const confirmDeleteAccount = () => {
    Alert.alert(
      'Final Confirmation',
      'By deleting your account, you will lose all your data, including events, messages, and connections. Type "DELETE" to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              await deleteAccount();
              await logout();
              // Navigation to login screen will be handled by AuthContext
            } catch (error) {
              console.error('Account deletion failed:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setIsSaving(false);
            }
          }
        }
      ],
      {
        cancelable: true,
      }
    );
  };
  
  const renderSettingItem = (
    title: string, 
    value: boolean, 
    onToggle: (value: boolean) => void, 
    icon: keyof typeof Ionicons.glyphMap, 
    iconColor: string = '#4F46E5'
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#D1D5DB', true: '#C7D2FE' }}
        thumbColor={value ? '#4F46E5' : '#F3F4F6'}
        ios_backgroundColor="#D1D5DB"
      />
    </View>
  );
  
  const renderLinkItem = (
    title: string, 
    icon: keyof typeof Ionicons.glyphMap, 
    onPress: () => void, 
    iconColor: string = '#4F46E5', 
    textColor: string = '#1F2937'
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: textColor }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      
      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.savingText}>Processing...</Text>
        </View>
      )}
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          {renderSettingItem(
            'Push Notifications',
            settings.pushNotifications,
            (value: boolean) => handleToggleSetting('pushNotifications', value),
            'notifications-outline'
          )}
          
          {renderSettingItem(
            'Email Notifications',
            settings.emailNotifications,
            (value: boolean) => handleToggleSetting('emailNotifications', value),
            'mail-outline'
          )}
          
          {renderSettingItem(
            'Event Reminders',
            settings.eventReminders,
            (value: boolean) => handleToggleSetting('eventReminders', value),
            'calendar-outline'
          )}
          
          {renderSettingItem(
            'Message Notifications',
            settings.messageNotifications,
            (value: boolean) => handleToggleSetting('messageNotifications', value),
            'chatbubble-outline'
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          {renderSettingItem(
            'Private Profile',
            settings.privateProfile,
            (value: boolean) => handleToggleSetting('privateProfile', value),
            'lock-closed-outline'
          )}
          
          {renderSettingItem(
            'Location Sharing',
            settings.locationSharing,
            (value: boolean) => handleToggleSetting('locationSharing', value),
            'location-outline'
          )}
          
          {renderSettingItem(
            'Show Distance to Events',
            settings.showDistance,
            (value: boolean) => handleToggleSetting('showDistance', value),
            'navigate-outline'
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          {renderSettingItem(
            'Dark Mode',
            settings.darkMode,
            (value: boolean) => handleToggleSetting('darkMode', value),
            'moon-outline'
          )}
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => {
              Alert.alert(
                'Change Measurement Units',
                'Select your preferred measurement system',
                [
                  { 
                    text: 'Metric (km)', 
                    onPress: () => handleToggleSetting('units', 'metric') 
                  },
                  { 
                    text: 'Imperial (miles)', 
                    onPress: () => handleToggleSetting('units', 'imperial') 
                  },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons name="options-outline" size={22} color="#4F46E5" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Measurement Units</Text>
              <Text style={styles.settingValue}>
                {settings.units === 'metric' ? 'Metric (km)' : 'Imperial (miles)'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {renderLinkItem(
            'Edit Profile',
            'person-outline',
            () => navigation.navigate('EditProfile'),
          )}
          
          {renderLinkItem(
            'Change Password',
            'key-outline',
            () => navigation.navigate('ChangePassword'),
          )}
          
          {renderLinkItem(
            'Payment Methods',
            'card-outline',
            () => navigation.navigate('PaymentMethods'),
          )}
          
          {renderLinkItem(
            'Privacy Policy',
            'document-text-outline',
            () => navigation.navigate('PrivacyPolicy'),
          )}
          
          {renderLinkItem(
            'Terms of Service',
            'document-outline',
            () => navigation.navigate('TermsOfService'),
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          {renderLinkItem(
            'Help Center',
            'help-circle-outline',
            () => navigation.navigate('HelpCenter'),
          )}
          
          {renderLinkItem(
            'Report a Problem',
            'warning-outline',
            () => navigation.navigate('ReportProblem'),
          )}
          
          {renderLinkItem(
            'Contact Us',
            'mail-outline',
            () => navigation.navigate('ContactUs'),
          )}
        </View>
        
        <View style={styles.dangerSection}>
          {renderLinkItem(
            'Logout',
            'log-out-outline',
            handleLogout,
            '#EF4444',
            '#EF4444'
          )}
          
          {renderLinkItem(
            'Delete Account',
            'trash-outline',
            handleDeleteAccount,
            '#EF4444',
            '#EF4444'
          )}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.versionText}>KickMates v1.0.0</Text>
        </View>
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
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dangerSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#1F2937',
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  savingOverlay: {
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
  savingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
});

export default SettingsScreen; 