import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import TicketsScreen from '../screens/TicketsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import CalendarScreen from '../screens/CalendarScreen';
import RaiseTicketScreen from '../screens/RaiseTicketScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CustomHeader from '../components/CustomHeader';

import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Tickets') {
            iconName = focused ? 'ticket' : 'ticket-outline';
          } else if (route.name === 'RaiseTicket') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Payment') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.lightGray,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: Layout.fontSize.xs,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.primary,
          elevation: 4,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: Layout.fontSize.lg,
        },
      })}
    >
      <Tab.Screen 
        name="Tickets" 
        component={TicketsScreen}
        options={{
          title: 'My Tickets',
          headerTitle: () => <CustomHeader title="My Tickets" />,
        }}
      />
      
      <Tab.Screen 
        name="RaiseTicket" 
        component={RaiseTicketScreen}
        options={{
          title: 'Raise Ticket',
          headerTitle: 'Raise Ticket',
        }}
      />
      
      <Tab.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{
          title: 'Payment',
          headerTitle: 'Pay Maintenance',
        }}
      />
      
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{
          title: 'Calendar',
          headerTitle: 'Calendar',
        }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
