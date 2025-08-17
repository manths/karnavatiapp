import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState, Alert, Platform } from 'react-native';

import ThemeProvider from './src/components/ThemeProvider';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/components/SplashScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import ToastProvider from './src/context/ToastContext';
import { SafeAccess, SafeAsync, SafeConsole } from './src/utils/safeAccess';
import { NetworkHandler, setupGlobalErrorHandling } from './src/utils/networkHandler';
import { TunnelHandler, initializeTunnelMonitoring } from './src/utils/tunnelHandler';
import { initializeReactNativeErrorHandling } from './src/utils/reactNativeErrorHandler';
import NotificationService from './src/services/notificationService';
import StorageService from './src/services/storage';
import { USER_STATUS } from './src/constants/userRoles';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [userName, setUserName] = useState(null);
  const [userStatus, setUserStatus] = useState(null);

  useEffect(() => {
    // Initialize React Native specific error handling first
    initializeReactNativeErrorHandling();
    
    // Setup global error handling for network issues
    setupGlobalErrorHandling();
    
    // Initialize tunnel monitoring
    initializeTunnelMonitoring();
    
    // Show connection info
    TunnelHandler.showConnectionInfo();
    
    checkUserData();
    
    // Handle app state changes to prevent update errors
    const handleAppStateChange = (nextAppState) => {
      SafeConsole.log('App state changed to:', nextAppState);
      if (nextAppState === 'active') {
        // Re-check tunnel connection when app becomes active
        TunnelHandler.autoFix();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const checkUserData = async () => {
    try {
      const userData = await SafeAsync.execute(
        StorageService.getUserData,
        null
      );
      if (userData) {
        setUserName(SafeAccess.get(userData, 'username', ''));
        setUserStatus(SafeAccess.get(userData, 'status', USER_STATUS.PENDING));
        
        // Initialize notifications for logged-in users
        initializeNotifications();
      }
    } catch (error) {
      SafeConsole.log('No user data found:', SafeAccess.get(error, 'message', error));
      // Set safe defaults
      setUserName('');
      setUserStatus(USER_STATUS.PENDING);
    } finally {
      // Always complete splash loading even if there are errors
      setTimeout(() => {
        setShowSplash(false);
      }, 2000);
    }
  };

  const initializeNotifications = async () => {
    try {
      SafeConsole.log('🔔 Starting notification setup...');
      
      // Small delay to ensure UI is ready
      setTimeout(async () => {
        const result = await NotificationService.initializeNotifications();
        
        if (result.success) {
          SafeConsole.log('✅ Notifications setup completed');
          // Optionally store the push token for backend use
          if (result.pushToken) {
            await StorageService.setItem('pushToken', result.pushToken);
          }
        } else {
          SafeConsole.log('📵 Notifications setup skipped:', result.reason);
        }
      }, 1500); // Wait for UI to settle
    } catch (error) {
      SafeConsole.error('Error setting up notifications:', error);
    }
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Add global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      SafeConsole.warn('Unhandled promise rejection:', event.reason);
      // Prevent the default behavior (logging to console)
      if (event.preventDefault) {
        event.preventDefault();
      }
    };

    // Only add web-specific event listeners on web platform
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, []);

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen 
          userName={userName} 
          userStatus={userStatus}
          onComplete={handleSplashComplete} 
        />
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ToastProvider>
          <ThemeProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </ThemeProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
