import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ThemeProvider from './src/components/ThemeProvider';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/components/SplashScreen';
import ToastProvider from './src/context/ToastContext';
import StorageService from './src/services/storage';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    checkUserData();
  }, []);

  const checkUserData = async () => {
    try {
      const userData = await StorageService.getUserData();
      if (userData && userData.username) {
        setUserName(userData.username);
      }
    } catch (error) {
      console.log('No user data found');
    }
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen 
          userName={userName} 
          onComplete={handleSplashComplete} 
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <ThemeProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </ThemeProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
