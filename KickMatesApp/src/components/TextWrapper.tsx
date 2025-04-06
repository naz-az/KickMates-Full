import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * TextWrapper is a utility component that ensures all text is properly wrapped in Text components.
 * This helps prevent the "Unexpected text node: . A text node cannot be a child of a <View>" error.
 */
interface TextWrapperProps {
  children: React.ReactNode;
  style?: any;
}

const TextWrapper: React.FC<TextWrapperProps> = ({ children, style }) => {
  // If children is a string or number, wrap it in a Text component
  if (typeof children === 'string' || typeof children === 'number') {
    return <Text style={style}>{children}</Text>;
  }
  
  // If children is an array, map through it and wrap any string/number in Text
  if (Array.isArray(children)) {
    return (
      <View>
        {children.map((child, index) => {
          if (typeof child === 'string' || typeof child === 'number') {
            return <Text key={index} style={style}>{child}</Text>;
          }
          return <React.Fragment key={index}>{child}</React.Fragment>;
        })}
      </View>
    );
  }
  
  // Otherwise, return the children as is
  return <>{children}</>;
};

export default TextWrapper; 