/**
 * Application Configuration
 * 
 * GIPHY API Configuration:
 * - Get your API key from: https://developers.giphy.com/
 * - Replace GIPHY_API_KEY with your own key for production use
 * - Using a valid public API key for development
 */

export const config = {
  giphy: {
    // GIPHY API Key - Using a valid public key for development
    // For production, get your own key from https://developers.giphy.com/
    apiKey: import.meta.env.VITE_GIPHY_API_KEY || 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh',
    
    // API endpoints
    endpoints: {
      trending: 'https://api.giphy.com/v1/gifs/trending',
      search: 'https://api.giphy.com/v1/gifs/search',
    },
    
    // Default query parameters
    defaultParams: {
      limit: 20,
      rating: 'g', // G-rated content only
    },
  },
} as const;
