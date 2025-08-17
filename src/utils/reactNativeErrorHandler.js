// React Native specific error handling
import { Platform } from 'react-native';
import { SafeConsole } from './safeAccess';

export const ReactNativeErrorHandler = {
  // Setup error handling for React Native
  setupErrorHandling: () => {
    if (Platform.OS !== 'web') {
      // Set up global error handler for React Native
      const originalHandler = ErrorUtils?.getGlobalHandler?.();
      
      ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
        SafeConsole.error('Global error caught:', error);
        
        // Handle the error gracefully
        if (error?.message?.includes('window.addEventListener')) {
          SafeConsole.log('Window API error handled - this is expected in React Native');
          return; // Don't crash for window API errors
        }
        
        if (error?.message?.includes('remote updates')) {
          SafeConsole.log('Remote update error handled - tunnel mode active');
          return; // Don't crash for update errors
        }
        
        // For other errors, call the original handler if available
        if (originalHandler && isFatal) {
          originalHandler(error, isFatal);
        }
      });
    }
  },

  // Handle promise rejections in React Native
  setupPromiseRejectionHandler: () => {
    // React Native doesn't have window.addEventListener, so we use a different approach
    const originalConsoleError = console.error;
    
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Filter out expected errors
      if (message.includes('window.addEventListener') || 
          message.includes('remote updates') ||
          message.includes('tunnel')) {
        SafeConsole.log('Filtered expected error:', message);
        return;
      }
      
      // Call original console.error for genuine errors
      originalConsoleError.apply(console, args);
    };
  },

  // Check if error is safe to ignore
  isSafeError: (error) => {
    const message = error?.message || error?.toString() || '';
    
    const safeErrors = [
      'window.addEventListener',
      'window is not defined',
      'navigator is not defined',
      'remote updates',
      'tunnel connection',
      'exp.direct'
    ];
    
    return safeErrors.some(safeError => message.includes(safeError));
  },

  // Log safe errors without crashing
  logSafeError: (error) => {
    if (ReactNativeErrorHandler.isSafeError(error)) {
      SafeConsole.log('Safe error logged:', error?.message || error);
      return true;
    }
    return false;
  }
};

// Initialize React Native error handling
export const initializeReactNativeErrorHandling = () => {
  if (Platform.OS !== 'web') {
    SafeConsole.log('Initializing React Native error handling...');
    ReactNativeErrorHandler.setupErrorHandling();
    ReactNativeErrorHandler.setupPromiseRejectionHandler();
  }
};
