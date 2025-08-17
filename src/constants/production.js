import { Platform } from 'react-native';

// Environment detection with fallbacks
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

// Production-specific configurations
export const PRODUCTION_CONFIG = {
  // Environment detection
  isDevelopment: isDev,
  isProduction: !isDev,
  
  // UI Configuration for production
  ui: {
    // Use modal-based dropdowns instead of native pickers
    useModalDropdowns: !isDev || Platform.OS === 'android',
    
    // Enhanced error display
    enhancedValidation: true,
    
    // Better toast positioning
    toastDuration: 3000,
  },
  
  // Payment configuration
  payment: {
    // Use generic UPI URLs in production for better compatibility
    useGenericUPI: !isDev,
    
    // Fallback behavior
    enableFallbacks: true,
    
    // UPI app detection strategy
    detectionStrategy: isDev ? 'canOpenURL' : 'direct',
  },
  
  // Deep linking
  deepLinking: {
    scheme: 'karnavatiapp',
    
    // Production URLs
    baseUrl: isDev 
      ? 'exp://localhost:8081' 
      : 'karnavatiapp://karnavatiapp.com',
  },
  
  // Logging
  logging: {
    enabled: isDev,
    level: isDev ? 'debug' : 'error',
  },
};

// Production utility functions
export const ProductionUtils = {
  // Safe UPI URL opening
  openUPIUrl: async (url, appName) => {
    try {
      const { Linking } = require('react-native');
      
      if (!url || typeof url !== 'string') {
        return { success: false, error: 'Invalid URL provided' };
      }
      
      if (PRODUCTION_CONFIG.payment.detectionStrategy === 'direct') {
        // In production, try direct opening without checking
        await Linking.openURL(url);
        return { success: true };
      } else {
        // In development, check first
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return { success: true };
        } else {
          return { success: false, error: `${appName || 'App'} not available` };
        }
      }
    } catch (error) {
      return { success: false, error: error?.message || 'Failed to open URL' };
    }
  },
  
  // Safe logging
  log: (message, level = 'debug') => {
    if (PRODUCTION_CONFIG.logging.enabled && message) {
      const logLevel = level?.toUpperCase() || 'DEBUG';
      console.log(`[${logLevel}] ${message}`);
    }
  },
  
  // Error logging (always enabled)
  logError: (error, context = '') => {
    const errorMessage = error?.message || error || 'Unknown error';
    const contextMessage = context ? `${context}: ` : '';
    console.error(`[ERROR] ${contextMessage}${errorMessage}`);
    
    // In production, you might want to send this to a crash reporting service
    if (PRODUCTION_CONFIG.isProduction) {
      // TODO: Add crash reporting service integration
    }
  },
};
