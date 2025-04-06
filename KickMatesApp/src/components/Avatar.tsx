import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../theme/theme';

interface AvatarProps {
  size?: number | 'small' | 'medium' | 'large' | 'xlarge';
  source?: { uri: string } | null;
  name?: string;
  gradient?: boolean | string[];
  gradientColors?: string[];
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  status?: 'online' | 'offline' | 'away' | 'busy' | null;
  bordered?: boolean;
  borderColor?: string;
  borderWidth?: number;
}

const Avatar: React.FC<AvatarProps> = ({
  size = 'medium',
  source,
  name,
  gradient = false,
  gradientColors = theme.gradients.primary,
  style,
  onPress,
  status = null,
  bordered = false,
  borderColor = theme.colors.card,
  borderWidth = 2,
}) => {
  // Convert size to number
  const getSize = (): number => {
    if (typeof size === 'number') return size;
    
    switch (size) {
      case 'small': return 32;
      case 'medium': return 40;
      case 'large': return 56;
      case 'xlarge': return 80;
      default: return 40;
    }
  };

  // Get status dot color
  const getStatusColor = (): string => {
    switch (status) {
      case 'online': return theme.colors.success;
      case 'away': return theme.colors.warning;
      case 'busy': return theme.colors.error;
      case 'offline': return theme.colors.textMuted;
      default: return 'transparent';
    }
  };

  // Generate initials from name
  const getInitials = (): string => {
    if (!name) return '';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (
      nameParts[0].charAt(0).toUpperCase() +
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };

  // Get the gradient colors
  const getGradientColors = (): string[] => {
    if (Array.isArray(gradient)) {
      return gradient;
    }
    return gradientColors;
  };

  const avatarSize = getSize();
  const statusSize = avatarSize * 0.3;
  const fontSize = avatarSize * 0.4;
  const borderRadius = avatarSize / 2;
  const initials = getInitials();
  const statusColor = getStatusColor();

  // Base container style
  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius,
    overflow: 'hidden',
  };

  // Add border if requested
  if (bordered) {
    containerStyle.borderWidth = borderWidth;
    containerStyle.borderColor = borderColor;
  }

  // Render avatar content based on source availability
  const renderAvatarContent = () => {
    if (source && source.uri) {
      return (
        <Image
          source={source}
          style={styles.image}
          defaultSource={require('../assets/default-avatar.png')}
        />
      );
    }

    if (gradient) {
      return (
        <LinearGradient
          colors={getGradientColors()}
          style={styles.gradient}
        >
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </LinearGradient>
      );
    }

    return (
      <View style={[styles.placeholder, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Text style={[styles.initials, { fontSize, color: theme.colors.textSecondary }]}>
          {initials}
        </Text>
      </View>
    );
  };

  // Render the status indicator if needed
  const renderStatus = () => {
    if (!status) return null;

    return (
      <View
        style={[
          styles.statusDot,
          {
            width: statusSize,
            height: statusSize,
            borderRadius: statusSize / 2,
            backgroundColor: statusColor,
            borderWidth: bordered ? 2 : 1.5,
            borderColor: borderColor,
          },
        ]}
      />
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[containerStyle, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {renderAvatarContent()}
        {renderStatus()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      {renderAvatarContent()}
      {renderStatus()}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});

export default Avatar; 