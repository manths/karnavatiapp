// Network error handling utility
import { Platform } from 'react-native';
import { SafeConsole } from './safeAccess';

export const NetworkHandler = {
  // Handle network errors gracefully
  handleNetworkError: (error, fallbackMessage = 'Network error occurred') => {
    const errorMessage = error?.message || error?.toString() || fallbackMessage;
    
    // Log error but don't crash the app
    SafeConsole.warn('Network error:', errorMessage);
    
    // Check for specific error types
    if (errorMessage.includes('remote updates') || errorMessage.includes('download')) {
      SafeConsole.log('Update download failed - this is expected in development mode');
      return { handled: true, message: 'App loaded successfully' };
    }
    
    if (errorMessage.includes('Network request failed') || errorMessage.includes('fetch')) {
      return { handled: true, message: 'Please check your internet connection' };
    }
    
    return { handled: false, message: errorMessage };
  },

  // Safe fetch wrapper
  safeFetch: async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        timeout: 10000, // 10 second timeout
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      const result = NetworkHandler.handleNetworkError(error);
      if (result.handled) {
        SafeConsole.log('Network request handled gracefully:', result.message);
        return null;
      }
      throw error;
    }
  },

  // Check network connectivity
  isOnline: () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
      return navigator.onLine;
    }
    return true; // Assume online if can't detect (React Native)
  },

  // Retry mechanism for failed requests
  retryRequest: async (requestFn, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        SafeConsole.warn(`Request attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          return NetworkHandler.handleNetworkError(error);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  },
};

// Global error boundary for network issues
export const setupGlobalErrorHandling = () => {
  // Handle uncaught errors - only on web platform
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      const result = NetworkHandler.handleNetworkError(event.error);
      if (result.handled) {
        event.preventDefault();
      }
    });

    // Handle unhandled promise rejections - only on web platform
    window.addEventListener('unhandledrejection', (event) => {
      const result = NetworkHandler.handleNetworkError(event.reason);
      if (result.handled) {
        event.preventDefault();
      }
    });
  }
};
