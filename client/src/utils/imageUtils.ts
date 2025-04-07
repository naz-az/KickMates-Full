/**
 * Utilities for handling image URLs and formatting throughout the application
 */

/**
 * Formats image URLs to handle various formats including local server paths and external URLs
 * @param imageUrl - The original image URL
 * @param defaultImage - Optional default image URL to use if imageUrl is empty
 * @returns Formatted image URL
 */
export const formatImageUrl = (
  imageUrl: string | null | undefined,
  defaultImage: string = 'https://images.unsplash.com/photo-1517649763962-0c623066013b'
): string => {
  if (!imageUrl) return defaultImage;
  
  // If the URL already starts with http or https, use it as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If the URL already starts with /uploads, we can just prefix the server URL
  if (imageUrl.startsWith('/uploads/')) {
    return `http://localhost:5001${imageUrl}`;
  }
  
  // Otherwise, assume it's a relative path and construct the full URL
  return `http://localhost:5001/uploads/${imageUrl.replace(/^\/+/, '')}`;
}; 