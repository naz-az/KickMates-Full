import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme/theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  maxLength?: number;
  editable?: boolean;
  style?: ViewStyle;
  leftIcon?: string; // Ionicons name
  rightIcon?: string; // Ionicons name
  onRightIconPress?: () => void;
  helper?: string;
  required?: boolean;
  animatedPlaceholder?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  returnKeyType,
  onSubmitEditing,
  multiline = false,
  numberOfLines = 1,
  error,
  icon,
  containerStyle,
  inputStyle,
  maxLength,
  editable = true,
  style,
  leftIcon,
  rightIcon,
  onRightIconPress,
  helper,
  required = false,
  animatedPlaceholder = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);
  const animatedLabelPosition = React.useRef(new Animated.Value(
    value ? 1 : 0
  )).current;
  
  const handleFocus = () => {
    setIsFocused(true);
    if (animatedPlaceholder) {
      Animated.timing(animatedLabelPosition, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    if (animatedPlaceholder && !value) {
      Animated.timing(animatedLabelPosition, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };
  
  const toggleShowPassword = () => setShowPassword(!showPassword);

  // Animated label style
  const labelStyle = {
    top: animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [14, -8],
    }),
    fontSize: animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.textMuted, theme.colors.textSecondary],
    }),
  };

  return (
    <View style={[styles.container, containerStyle, style]}>
      {label && !animatedPlaceholder && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.requiredMark}>*</Text>}
        </View>
      )}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
        !editable && styles.inputContainerDisabled,
      ]}>
        {leftIcon && (
          <View style={styles.iconContainer}>
            <Ionicons 
              name={leftIcon} 
              size={20} 
              color={isFocused ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </View>
        )}
        
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        
        {animatedPlaceholder && (
          <Animated.Text 
            style={[
              styles.animatedLabel, 
              labelStyle, 
              error && styles.errorLabel
            ]}
          >
            {label}{required ? ' *' : ''}
          </Animated.Text>
        )}
        
        <TextInput
          style={[
            styles.input,
            (icon || leftIcon) && styles.inputWithIcon,
            secureTextEntry && styles.inputWithToggle,
            rightIcon && styles.inputWithRightIcon,
            multiline && styles.multilineInput,
            inputStyle,
          ]}
          placeholder={animatedPlaceholder ? (isFocused || value ? placeholder : '') : placeholder}
          placeholderTextColor={theme.colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          editable={editable}
          selectionColor={theme.colors.primary}
        />
        
        {rightIcon && (
          <TouchableOpacity 
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            <Ionicons 
              name={rightIcon} 
              size={20} 
              color={isFocused ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </TouchableOpacity>
        )}
        
        {secureTextEntry && (
          <TouchableOpacity style={styles.toggleButton} onPress={toggleShowPassword}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={isFocused ? theme.colors.primary : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helper && !error && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  requiredMark: {
    color: theme.colors.error,
    marginLeft: 4,
  },
  animatedLabel: {
    position: 'absolute',
    left: 12,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 4,
    fontWeight: '500',
    zIndex: 10,
  },
  errorLabel: {
    color: theme.colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  inputContainerFocused: {
    borderColor: theme.colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      }
    }),
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: theme.colors.surfaceVariant,
    borderColor: theme.colors.border,
  },
  iconContainer: {
    paddingLeft: 12,
  },
  rightIconContainer: {
    paddingRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '400',
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  inputWithToggle: {
    paddingRight: 40,
  },
  inputWithRightIcon: {
    paddingRight: 40,
  },
  multilineInput: {
    height: 'auto',
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  toggleButton: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input; 