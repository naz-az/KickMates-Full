import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

// Keep the splash screen visible until resources are loaded
SplashScreen.preventAutoHideAsync();

// Define the app theme based on KickMates color scheme with enhanced modern styling
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4361EE', // Enhanced indigo for better contrast
    secondary: '#3F37C9', // Secondary accent color
    accent: '#4CC9F0', // Bright cyan for accents
    success: '#4ADE80', // Vibrant green
    warning: '#FBBF24', // Warm yellow
    error: '#F87171', // Soft red
    background: '#F8FAFC', // Lighter background for better readability
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9', // Alternative surface color
    card: '#FFFFFF',
    text: '#1E293B', // Darker text for better contrast
    secondaryText: '#64748B', // Secondary text color
    placeholder: '#94A3B8', // Placeholder text color
    border: '#E2E8F0', // Subtle border color
    notification: '#EC4899', // Notification color
    shadow: 'rgba(0, 0, 0, 0.1)', // Shadow color
  },
  roundness: 12, // Increased roundness for modern feel
  elevation: {
    level1: 2,
    level2: 3,
    level3: 6,
    level4: 8,
    level5: 12,
  },
  fonts: DefaultTheme.fonts,
};

export default function App() {
  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts and other assets
        await Font.loadAsync({
          'Roboto-Regular': require('./src/assets/fonts/Roboto-Regular.ttf'),
          'Roboto-Medium': require('./src/assets/fonts/Roboto-Medium.ttf'),
          'Roboto-Bold': require('./src/assets/fonts/Roboto-Bold.ttf'),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        // Hide splash screen
        await SplashScreen.hideAsync();
      }
    }
    
    prepare();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NavigationContainer theme={{
            dark: false,
            colors: {
              primary: theme.colors.primary,
              background: theme.colors.background,
              card: theme.colors.card,
              text: theme.colors.text,
              border: theme.colors.border,
              notification: theme.colors.notification,
            }
          }}>
            <StatusBar style="auto" />
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
} 