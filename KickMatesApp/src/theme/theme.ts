import { Platform } from 'react-native';
import { toGradientTuple } from '../utils/gradientUtils';

// KickMates theme with enhanced styling
export const theme = {
  colors: {
    primary: '#4361EE',
    primaryDark: '#3A0CA3',
    secondary: '#4CC9F0',
    secondaryDark: '#3F37C9',
    accent: '#7209B7',
    success: '#4ADE80',
    successDark: '#10B981',
    warning: '#FBBF24',
    warningDark: '#F59E0B',
    error: '#F87171',
    errorDark: '#DC2626',
    background: '#F8FAFC',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    text: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    divider: '#E2E8F0',
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    transparent: 'transparent',
    
    // Sport type colors
    football: ['#4CC9F0', '#4361EE'],
    basketball: ['#F72585', '#7209B7'],
    tennis: ['#4ADE80', '#10B981'],
    volleyball: ['#FB923C', '#F97316'],
    cricket: ['#FBBF24', '#F59E0B'],
    rugby: ['#7C3AED', '#6D28D9'],
    yoga: ['#8B5CF6', '#6D28D9'],
    running: ['#FB923C', '#F97316'], 
    cycling: ['#3B82F6', '#2563EB'],
    swimming: ['#38BDF8', '#0284C7'],
    golf: ['#10B981', '#047857'],
    default: ['#4361EE', '#3A0CA3'],
  },

  typography: {
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 28,
      hero: 32,
    },
    fontWeights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40,
    jumbo: 48,
    mega: 64,
  },

  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },

  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
    md: Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
    lg: Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
    xl: Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.15)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 18,
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
    colored: (color: string) =>
      Platform.select({
        ios: {
          shadowColor: color,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
        default: {},
      }),
  },

  animations: {
    durations: {
      fastest: 100,
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      ease: [0.25, 0.1, 0.25, 1],
      easeIn: [0.42, 0, 1, 1],
      easeOut: [0, 0, 0.58, 1],
      easeInOut: [0.42, 0, 0.58, 1],
    },
  },

  gradients: {
    primary: ['#4361EE', '#3A0CA3'],
    secondary: ['#4CC9F0', '#4361EE'],
    accent: ['#F72585', '#7209B7'],
    success: ['#4ADE80', '#10B981'],
    warning: ['#FBBF24', '#F59E0B'],
    error: ['#F87171', '#DC2626'],
    cool: ['#8B5CF6', '#6D28D9'],
    warm: ['#FB923C', '#F97316'],
  },
};

// Helper function to get a gradient for a sport type
export const getSportGradient = (sportType: string): string[] => {
  const lowerCaseSport = sportType.toLowerCase();
  const sportKey = lowerCaseSport as keyof typeof theme.colors;
  
  // Check if the sport has a defined gradient
  if (Array.isArray(theme.colors[sportKey])) {
    return theme.colors[sportKey] as string[];
  }
  
  // Return default gradient
  return theme.colors.default;
};

// Get a properly typed gradient for LinearGradient component
export const getGradient = (gradientKey: keyof typeof theme.gradients) => {
  return toGradientTuple(theme.gradients[gradientKey]);
};

export default theme; 