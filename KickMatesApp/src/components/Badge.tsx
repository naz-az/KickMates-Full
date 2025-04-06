import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StyleProp, 
  ViewStyle,
  TextStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme/theme';
import { toGradientTuple } from '../utils/gradientUtils';

interface BadgeProps {
  label: string;
  variant?: 'solid' | 'outline' | 'gradient';
  color?: keyof typeof theme.colors | string;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  pill?: boolean;
  onPress?: () => void;
  gradientColors?: string[];
}

const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'solid',
  color = 'primary',
  size = 'medium',
  style,
  textStyle,
  icon,
  iconSize,
  pill = false,
  onPress,
  gradientColors
}) => {
  const isInteractive = !!onPress;
  const Container = isInteractive ? TouchableOpacity : View;
  
  // Determine styles based on props
  const getBadgeStyles = () => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    };

    // Size
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = 8;
        baseStyle.paddingVertical = 4;
        baseStyle.borderRadius = pill ? 12 : 4;
        break;
      case 'large':
        baseStyle.paddingHorizontal = 16;
        baseStyle.paddingVertical = 8;
        baseStyle.borderRadius = pill ? 24 : 8;
        break;
      case 'medium':
      default:
        baseStyle.paddingHorizontal = 12;
        baseStyle.paddingVertical = 6;
        baseStyle.borderRadius = pill ? 16 : 6;
    }

    // Get appropriate color
    let backgroundColor = theme.colors.primary;
    let borderColor = theme.colors.primary;
    
    // Solid or outline variant
    if (typeof color === 'string' && color in theme.colors && typeof theme.colors[color as keyof typeof theme.colors] === 'string') {
      backgroundColor = theme.colors[color as keyof typeof theme.colors] as string;
      borderColor = backgroundColor;
    } else if (typeof color === 'string') {
      backgroundColor = color;
      borderColor = color;
    }

    // Variant specific styling
    switch (variant) {
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor,
        };
      case 'gradient':
        return {
          ...baseStyle,
        };
      case 'solid':
      default:
        return {
          ...baseStyle,
          backgroundColor,
        };
    }
  };

  // Get text color based on variant and color
  const getTextColor = (): string => {
    if (variant === 'outline') {
      if (typeof color === 'string' && color in theme.colors && typeof theme.colors[color as keyof typeof theme.colors] === 'string') {
        return theme.colors[color as keyof typeof theme.colors] as string;
      } else if (typeof color === 'string') {
        return color;
      }
      return theme.colors.primary;
    }
    return '#FFFFFF';
  };

  // Get icon size based on badge size
  const getIconSize = (): number => {
    if (iconSize) return iconSize;
    
    switch (size) {
      case 'small': return 12;
      case 'large': return 18;
      case 'medium':
      default: return 16;
    }
  };

  // Determine gradient colors
  const getGradientColors = () => {
    if (gradientColors && gradientColors.length >= 2) {
      return toGradientTuple(gradientColors);
    }
    
    // Use theme gradients if available
    if (typeof color === 'string' && color in theme.gradients) {
      return toGradientTuple(theme.gradients[color as keyof typeof theme.gradients]);
    }
    
    // Default gradient
    return toGradientTuple(['#4361EE', '#3A0CA3']);
  };

  const badgeStyles = getBadgeStyles();
  const textColor = getTextColor();
  const iconSizeValue = getIconSize();

  // Text style based on size
  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      color: textColor,
      fontWeight: '600',
    };

    switch (size) {
      case 'small':
        baseStyle.fontSize = 11;
        break;
      case 'large':
        baseStyle.fontSize = 15;
        break;
      case 'medium':
      default:
        baseStyle.fontSize = 13;
    }

    return baseStyle;
  };
  
  const renderContent = () => (
    <>
      {icon && (
        <Ionicons 
          name={icon} 
          size={iconSizeValue} 
          color={textColor} 
          style={styles.icon} 
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>{label}</Text>
    </>
  );
  
  // Render with gradient if applicable
  if (variant === 'gradient') {
    return (
      <Container 
        style={style} 
        onPress={isInteractive ? onPress : undefined}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={badgeStyles}
        >
          {renderContent()}
        </LinearGradient>
      </Container>
    );
  }
  
  return (
    <Container 
      style={[badgeStyles, style]} 
      onPress={isInteractive ? onPress : undefined}
      activeOpacity={0.8}
    >
      {renderContent()}
    </Container>
  );
};

const styles = StyleSheet.create({
  icon: {
    marginRight: 4,
  },
});

export default Badge; 