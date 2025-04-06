import React from 'react';
import { Text } from 'react-native';

/**
 * Utility function to ensure text nodes are wrapped in Text components
 * Use this to fix the "Unexpected text node: . A text node cannot be a child of a <View>" error
 * 
 * @param children - The children to process
 * @returns - The processed children with text nodes wrapped in Text components
 */
export const wrapTextNodes = (children: React.ReactNode): React.ReactNode => {
  // If it's a string or number, wrap it in a Text component
  if (typeof children === 'string' || typeof children === 'number') {
    return React.createElement(Text, null, children);
  }
  
  // If it's an array, process each child
  if (Array.isArray(children)) {
    return children.map((child, index) => 
      typeof child === 'string' || typeof child === 'number'
        ? React.createElement(Text, { key: `text-${index}` }, child)
        : child
    );
  }
  
  // Otherwise, return as is
  return children;
};

/**
 * Checks if a React element potentially has text nodes directly inside
 * 
 * @param element - The React element to check
 * @returns - True if the element might have text nodes directly inside
 */
export const mightHaveTextNodes = (element: React.ReactElement): boolean => {
  const { children } = element.props;
  
  if (typeof children === 'string' || typeof children === 'number') {
    return true;
  }
  
  if (Array.isArray(children)) {
    return children.some(child => 
      typeof child === 'string' || typeof child === 'number'
    );
  }
  
  return false;
};

export default {
  wrapTextNodes,
  mightHaveTextNodes
}; 