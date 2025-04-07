import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import EditEventScreen from '../screens/EditEventScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserEventsScreen from '../screens/UserEventsScreen';
import UserBookmarksScreen from '../screens/UserBookmarksScreen';
import DiscussionsScreen from '../screens/DiscussionsScreen';
import DiscussionDetailScreen from '../screens/DiscussionDetailScreen';
import CreateDiscussionScreen from '../screens/CreateDiscussionScreen';
import EditDiscussionScreen from '../screens/EditDiscussionScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ConversationScreen from '../screens/ConversationScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MembersScreen from '../screens/MembersScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import SplashScreen from '../screens/SplashScreen';
import CustomDrawerContent from '../components/CustomDrawerContent';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import ReportProblemScreen from '../screens/ReportProblemScreen';
import ContactUsScreen from '../screens/ContactUsScreen';

// Define the parameter types for each navigator
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Splash: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainDrawerParamList = {
  Home: undefined;
  ProfileStack: undefined;
  Events: undefined;
  Discussions: undefined;
  Messages: undefined;
  Notifications: undefined;
  Members: undefined;
  Settings: undefined;
  Search: undefined;
};

export type HomeTabParamList = {
  HomeScreen: undefined;
  EventsTab: undefined;
  DiscussionsTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
  CreateEvent: undefined;
};

export type EventsStackParamList = {
  EventsList: undefined;
  EventDetail: { id: string };
  EditEvent: { id: string };
};

export type DiscussionsStackParamList = {
  DiscussionsList: undefined;
  DiscussionDetail: { id: string };
  CreateDiscussion: undefined;
  EditDiscussion: { id: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  UserEvents: undefined;
  UserBookmarks: undefined;
  UserProfile: { id: string };
  Settings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  PaymentMethods: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  HelpCenter: undefined;
  ReportProblem: undefined;
  ContactUs: undefined;
};

export type MessagesStackParamList = {
  MessagesList: undefined;
  Conversation: { id: string | number };
};

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainDrawer = createDrawerNavigator<MainDrawerParamList>();
const Tab = createBottomTabNavigator<HomeTabParamList>();
const EventsStack = createNativeStackNavigator<EventsStackParamList>();
const DiscussionsStack = createNativeStackNavigator<DiscussionsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const MessagesStack = createNativeStackNavigator<MessagesStackParamList>();

// Auth Stack Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// Events Stack Navigator
const EventsNavigator = () => {
  return (
    <EventsStack.Navigator>
      <EventsStack.Screen name="EventsList" component={EventsScreen} options={{ title: 'Events' }} />
      <EventsStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event Details' }} />
      <EventsStack.Screen name="EditEvent" component={EditEventScreen} options={{ title: 'Edit Event' }} />
    </EventsStack.Navigator>
  );
};

// Discussions Stack Navigator
const DiscussionsNavigator = () => {
  return (
    <DiscussionsStack.Navigator>
      <DiscussionsStack.Screen name="DiscussionsList" component={DiscussionsScreen} options={{ title: 'Discussions' }} />
      <DiscussionsStack.Screen name="DiscussionDetail" component={DiscussionDetailScreen} options={{ title: 'Discussion' }} />
      <DiscussionsStack.Screen name="CreateDiscussion" component={CreateDiscussionScreen} options={{ title: 'Create Discussion' }} />
      <DiscussionsStack.Screen name="EditDiscussion" component={EditDiscussionScreen} options={{ title: 'Edit Discussion' }} />
    </DiscussionsStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileNavigator = () => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <ProfileStack.Screen name="UserEvents" component={UserEventsScreen} options={{ title: 'My Events' }} />
      <ProfileStack.Screen name="UserBookmarks" component={UserBookmarksScreen} options={{ title: 'My Bookmarks' }} />
      <ProfileStack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'User Profile' }} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
      <ProfileStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ title: 'Payment Methods' }} />
      <ProfileStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
      <ProfileStack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ title: 'Terms of Service' }} />
      <ProfileStack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ title: 'Help Center' }} />
      <ProfileStack.Screen name="ReportProblem" component={ReportProblemScreen} options={{ title: 'Report a Problem' }} />
      <ProfileStack.Screen name="ContactUs" component={ContactUsScreen} options={{ title: 'Contact Us' }} />
    </ProfileStack.Navigator>
  );
};

// Messages Stack Navigator
const MessagesNavigator = () => {
  return (
    <MessagesStack.Navigator>
      <MessagesStack.Screen name="MessagesList" component={MessagesScreen} options={{ title: 'Messages' }} />
      <MessagesStack.Screen name="Conversation" component={ConversationScreen} options={{ title: 'Conversation' }} />
    </MessagesStack.Navigator>
  );
};

// Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          
          if (route.name === 'HomeScreen') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'EventsTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'DiscussionsTab') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'MessagesTab') {
            iconName = focused ? 'mail' : 'mail-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'CreateEvent') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="EventsTab" component={EventsNavigator} options={{ title: 'Events' }} />
      <Tab.Screen 
        name="CreateEvent" 
        component={CreateEventScreen} 
        options={{ 
          title: 'Create Event',
          tabBarButton: () => null, // Hide tab button but keep in navigator
        }} 
      />
      <Tab.Screen name="DiscussionsTab" component={DiscussionsNavigator} options={{ title: 'Discussions' }} />
      <Tab.Screen name="MessagesTab" component={MessagesNavigator} options={{ title: 'Messages' }} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

// Drawer Navigator
const DrawerNavigator = () => {
  return (
    <MainDrawer.Navigator 
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: '#4F46E5',
      }}
    >
      <MainDrawer.Screen 
        name="Home" 
        component={TabNavigator} 
        options={{
          drawerIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />
        }}
      />
      <MainDrawer.Screen 
        name="ProfileStack" 
        component={ProfileNavigator} 
        options={{
          title: 'My Profile',
          drawerIcon: ({ color }) => <Ionicons name="person" size={22} color={color} />
        }}
      />
      <MainDrawer.Screen 
        name="Events" 
        component={EventsNavigator} 
        options={{
          drawerIcon: ({ color }) => <Ionicons name="calendar" size={22} color={color} />
        }}
      />
      <MainDrawer.Screen 
        name="Discussions" 
        component={DiscussionsNavigator} 
        options={{
          drawerIcon: ({ color }) => <Ionicons name="chatbubbles" size={22} color={color} />
        }}
      />
      <MainDrawer.Screen 
        name="Messages" 
        component={MessagesNavigator} 
        options={{
          drawerIcon: ({ color }) => <Ionicons name="mail" size={22} color={color} />
        }}
      />
      <MainDrawer.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{
          drawerIcon: ({ color }) => <Ionicons name="notifications" size={22} color={color} />
        }}
      />
      <MainDrawer.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{
          drawerIcon: ({ color }) => <Ionicons name="search" size={22} color={color} />
        }}
      />
      <MainDrawer.Screen 
        name="Members" 
        component={MembersScreen} 
        options={{
          drawerIcon: ({ color }) => <Ionicons name="people" size={22} color={color} />
        }}
      />
      <MainDrawer.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          drawerIcon: ({ color }) => <Ionicons name="settings" size={22} color={color} />
        }}
      />
    </MainDrawer.Navigator>
  );
};

// Root Navigator
export const AppNavigator = () => {
  const { token, isLoading } = useContext(AuthContext);
  
  if (isLoading) {
    // Return our animated splash screen
    return <SplashScreen />;
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="Main" component={DrawerNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}; 