import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Avatar, Title, Caption, Drawer, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import TicketsScreen from '../screens/TicketsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import CalendarScreen from '../screens/CalendarScreen';
import RaiseTicketScreen from '../screens/RaiseTicketScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminConsoleScreen from '../screens/AdminConsoleScreen';

import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import StorageService from '../services/storage';
import { useToast } from '../context/ToastContext';

const DrawerNav = createDrawerNavigator();

// Custom Drawer Content
const CustomDrawerContent = (props) => {
  const [userData, setUserData] = React.useState(null);
  const { showSuccess } = useToast();

  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await StorageService.getUserData();
      setUserData(user);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearUserData();
              showSuccess('Logged out successfully!');
              setTimeout(() => {
                props.navigation.reset({
                  index: 0,
                  routes: [{ name: 'BuildingSelection' }],
                });
              }, 1000);
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ]
    );
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
        {/* User Profile Section */}
        <View style={styles.userInfoSection}>
          <View style={styles.userInfo}>
            <Avatar.Text 
              size={60} 
              label={userData ? getInitials(userData.username) : 'U'}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Title style={styles.title}>{userData?.username || 'User'}</Title>
              <Caption style={styles.caption}>Building: {userData?.buildingId || 'N/A'}</Caption>
              <Caption style={styles.phone}>
                {userData?.countryCode} {userData?.mobileNumber}
              </Caption>
            </View>
          </View>
        </View>

        {/* Navigation Items */}
        <Drawer.Section style={styles.drawerSection}>
          <DrawerItem
            icon={({ color, size }) => (
              <Ionicons name="ticket-outline" color={color} size={size} />
            )}
            label="My Tickets"
            onPress={() => props.navigation.navigate('Tickets')}
            labelStyle={styles.drawerLabel}
          />
          
          <DrawerItem
            icon={({ color, size }) => (
              <Ionicons name="add-circle-outline" color={color} size={size} />
            )}
            label="Raise Ticket"
            onPress={() => props.navigation.navigate('RaiseTicket')}
            labelStyle={styles.drawerLabel}
          />
          
          <DrawerItem
            icon={({ color, size }) => (
              <Ionicons name="card-outline" color={color} size={size} />
            )}
            label="Pay Maintenance"
            onPress={() => props.navigation.navigate('Payment')}
            labelStyle={styles.drawerLabel}
          />
          
          <DrawerItem
            icon={({ color, size }) => (
              <Ionicons name="calendar-outline" color={color} size={size} />
            )}
            label="Calendar"
            onPress={() => props.navigation.navigate('Calendar')}
            labelStyle={styles.drawerLabel}
          />
          
          <DrawerItem
            icon={({ color, size }) => (
              <Ionicons name="person-outline" color={color} size={size} />
            )}
            label="Profile"
            onPress={() => props.navigation.navigate('Profile')}
            labelStyle={styles.drawerLabel}
          />

          {/* Admin Console - Only visible to admin users */}
          {userData?.role === 'admin' && (
            <DrawerItem
              icon={({ color, size }) => (
                <Ionicons name="shield-outline" color={Colors.primary} size={size} />
              )}
              label="Admin Console"
              onPress={() => props.navigation.navigate('AdminConsole')}
              labelStyle={[styles.drawerLabel, { color: Colors.primary, fontWeight: 'bold' }]}
            />
          )}
        </Drawer.Section>
      </DrawerContentScrollView>

      {/* Logout Section */}
      <View style={styles.bottomDrawerSection}>
        <DrawerItem
          icon={({ color, size }) => (
            <Ionicons name="log-out-outline" color={Colors.error} size={size} />
          )}
          label="Logout"
          onPress={handleLogout}
          labelStyle={[styles.drawerLabel, { color: Colors.error }]}
        />
      </View>
    </View>
  );
};

const MainDrawerNavigator = () => {
  return (
    <DrawerNav.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
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
        drawerStyle: {
          backgroundColor: Colors.surface,
          width: 280,
        },
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.textSecondary,
      }}
    >
      <DrawerNav.Screen 
        name="Tickets" 
        component={TicketsScreen}
        options={{
          title: 'My Tickets',
          headerTitle: 'Karnavati Nagar Flat',
        }}
      />
      
      <DrawerNav.Screen 
        name="RaiseTicket" 
        component={RaiseTicketScreen}
        options={{
          title: 'Raise Ticket',
          headerTitle: 'Raise New Ticket',
        }}
      />
      
      <DrawerNav.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{
          title: 'Payment',
          headerTitle: 'Pay Maintenance',
        }}
      />
      
      <DrawerNav.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{
          title: 'Calendar',
          headerTitle: 'Community Calendar',
        }}
      />
      
      <DrawerNav.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
        }}
      />

      <DrawerNav.Screen 
        name="AdminConsole" 
        component={AdminConsoleScreen}
        options={{
          title: 'Admin Console',
          headerTitle: 'Admin Console',
        }}
      />
    </DrawerNav.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingLeft: Layout.spacing.lg,
    paddingRight: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.lg,
    backgroundColor: Colors.primary,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: Colors.white,
    marginRight: Layout.spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Layout.spacing.xs / 2,
  },
  caption: {
    fontSize: Layout.fontSize.sm,
    color: Colors.white,
    opacity: 0.8,
    marginBottom: Layout.spacing.xs / 2,
  },
  phone: {
    fontSize: Layout.fontSize.sm,
    color: Colors.white,
    opacity: 0.7,
  },
  drawerSection: {
    marginTop: Layout.spacing.md,
  },
  drawerLabel: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
  },
  bottomDrawerSection: {
    marginBottom: Layout.spacing.md,
    borderTopColor: Colors.lightGray,
    borderTopWidth: 1,
    paddingTop: Layout.spacing.md,
  },
});

export default MainDrawerNavigator;
