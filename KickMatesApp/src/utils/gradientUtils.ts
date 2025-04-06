/**
 * Utility functions for working with gradients in the app
 */

/**
 * Converts an array of gradient colors to the tuple format required by expo-linear-gradient
 * LinearGradient expects colors to be a readonly tuple with at least two string elements
 * 
 * @param colors Array of gradient colors
 * @returns A properly typed gradient color tuple for LinearGradient
 */
export const toGradientTuple = (colors: string[]): readonly [string, string, ...string[]] => {
  // Make sure we have at least 2 colors
  if (!colors || colors.length < 2) {
    // Return a default gradient if the input is invalid
    return ['#4361EE', '#3A0CA3'];
  }
  
  // Convert the array to the required tuple type
  return colors as unknown as readonly [string, string, ...string[]];
};

/**
 * A simplified version that just asserts the type when we know it's valid
 * Use this when you know your array has at least 2 colors
 */
export const asGradientColors = (colors: string[]): readonly [string, string, ...string[]] => {
  return colors as unknown as readonly [string, string, ...string[]];
}; 