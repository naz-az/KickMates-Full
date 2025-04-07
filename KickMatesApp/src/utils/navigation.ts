import { NavigationProp, CommonActions } from '@react-navigation/native';

/**
 * Navigate to a user's profile screen
 * If currentUserId matches userId, navigates to their own profile
 * Otherwise navigates to the UserProfile screen with the userId
 */
export const navigateToUserProfile = (
  navigation: any,
  userId: string | number,
  currentUserId?: string | number
) => {
  if (currentUserId && userId && currentUserId.toString() === userId.toString()) {
    // Navigate to tab screen - handles properly finding the ProfileTab
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          { 
            name: 'Main',
            state: {
              routes: [{ name: 'ProfileTab' }]
            }
          }
        ],
      })
    );
  } else {
    // It's another user's profile
    // Find the ProfileStack navigator in the hierarchy
    try {
      // Try to navigate directly to the ProfileStack first
      navigation.navigate('ProfileStack', {
        screen: 'UserProfile',
        params: { id: userId.toString() }
      });
    } catch (e) {
      // Fallback to using Main navigator
      navigation.navigate('Main', {
        screen: 'ProfileStack',
        params: {
          screen: 'UserProfile',
          params: { id: userId.toString() }
        }
      });
    }
  }
}; 