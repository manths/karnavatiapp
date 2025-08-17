import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Alert, Linking } from 'react-native';

import BuildingSelectionScreen from '../screens/BuildingSelectionScreen';
import AuthScreen from '../screens/AuthScreen';
import AccountPendingScreen from '../screens/AccountPendingScreen';
import AccountRequestsScreen from '../screens/AccountRequestsScreen';
import MainDrawerNavigator from './MainDrawerNavigator';
import TicketDetailsScreen from '../screens/TicketDetailsScreen';
import DatabaseService from '../services/database';

import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';

const Stack = createStackNavigator();

// Deep linking configuration
const linking = {
  prefixes: ['karnavatiapp://'],
  config: {
    screens: {
      Main: {
        screens: {
          Tickets: {
            screens: {
              TicketsList: 'tickets',
            },
          },
        },
      },
      TicketDetails: 'ticket/:ticketId',
    },
  },
  async getInitialURL() {
    // Handle URL when app is opened from a cold start
    const url = await Linking.getInitialURL();
    return url;
  },
  subscribe(listener) {
    // Handle URL when app is already running
    const onReceiveURL = ({ url }) => listener(url);
    Linking.addEventListener('url', onReceiveURL);
    return () => Linking.removeAllListeners('url');
  },
};

// Custom function to handle deep link navigation
const handleDeepLink = async (navigation, url) => {
  if (url && url.includes('/ticket/')) {
    const ticketId = url.split('/ticket/')[1];
    
    try {
      // Fetch ticket details from database
      const ticketResult = await DatabaseService.getTicketById(ticketId);
      
      if (ticketResult.success) {
        navigation.navigate('TicketDetails', { ticket: ticketResult.data });
      } else {
        Alert.alert('Error', 'Ticket not found or you do not have access to view this ticket.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load ticket details.');
    }
  }
};

const AppNavigator = () => {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="BuildingSelection"
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.primary,
            elevation: 4,
          },
          headerTintColor: Colors.white,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: Layout.fontSize.lg,
          },
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen 
          name="BuildingSelection" 
          component={BuildingSelectionScreen}
          options={{
            title: 'Select Building',
            headerShown: false,
          }}
        />
        
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen}
          options={{
            title: 'Authentication',
            headerShown: false,
          }}
        />
        
        <Stack.Screen 
          name="AccountPending" 
          component={AccountPendingScreen}
          options={{
            title: 'Account Pending',
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        
        <Stack.Screen 
          name="AccountRequests" 
          component={AccountRequestsScreen}
          options={{
            title: 'Account Requests',
            headerBackTitleVisible: false,
          }}
        />
        
        <Stack.Screen 
          name="Main" 
          component={MainDrawerNavigator}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        
        <Stack.Screen 
          name="TicketDetails" 
          component={TicketDetailsScreen}
          options={{
            title: 'Ticket Details',
            headerBackTitleVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
