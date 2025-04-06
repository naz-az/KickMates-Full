import React from 'react';
import { 
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Platform,
  Animated,
  StyleProp
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../theme/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'filled' | 'transparent';
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  gradient?: boolean;
  gradientColors?: string[];
  borderRadius?: number;
  touchFeedback?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
  elevation = 'md',
  gradient = false,
  gradientColors = theme.gradients.primary,
  borderRadius = theme.borderRadius.md,
  touchFeedback = true,
}) => {
  // Animation value for touch feedback
  const animatedScale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (touchFeedback && onPress) {
      Animated.spring(animatedScale, {
        toValue: 0.97,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (touchFeedback && onPress) {
      Animated.spring(animatedScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  // Apply the appropriate shadow based on elevation
  const getShadowStyle = () => {
    if (variant === 'elevated' || variant === 'filled') {
      return theme.shadows[elevation];
    }
    return theme.shadows.none;
  };

  // Create card style based on variant
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius,
      overflow: 'hidden',
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          ...getShadowStyle(),
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surfaceVariant,
          ...getShadowStyle(),
        };
      case 'transparent':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };

  const cardStyle = getCardStyle();
  const animatedStyle = {
    transform: [{ scale: animatedScale }],
  };

  const renderContent = () => {
    if (gradient) {
      return (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderRadius }]}
        >
          {children}
        </LinearGradient>
      );
    }
    return children;
  };

  if (onPress) {
    return (
      <Animated.View style={[animatedStyle]}>
        <TouchableOpacity
          style={[cardStyle, style]}
          onPress={onPress}
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {renderContent()}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={[cardStyle, style]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});

export default Card; 