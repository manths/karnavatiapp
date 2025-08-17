import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Avatar, Title, Caption, Drawer, Button, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import TicketsScreen from '../screens/TicketsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentReceiptsScreen from '../screens/PaymentReceiptsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import RaiseTicketScreen from '../screens/RaiseTicketScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminConsoleScreen from '../screens/AdminConsoleScreen';
import AccountRequestsScreen from '../screens/AccountRequestsScreen';

import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { USER_ROLES, hasPermission, PERMISSIONS } from '../constants/userRoles';
import { SafeAccess, SafeAsync, SafeConsole } from '../utils/safeAccess';
import StorageService from '../services/storage';
import PaymentVerificationService from '../services/paymentVerificationService';
import { NotificationService } from '../services/notificationService';
import { useToast } from '../context/ToastContext';

const DrawerNav = createDrawerNavigator();

// Custom Drawer Content
const CustomDrawerContent = (props) => {
  const [userData, setUserData] = React.useState(null);
  const { showSuccess } = useToast();

  React.useEffect(() => {
    loadUserData();
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      // Initialize permissions
      await NotificationService.initializePermissions();
      
      // Start payment verification service
      PaymentVerificationService.start();
      
      SafeConsole.log('Services initialized successfully');
    } catch (error) {
      SafeConsole.error('Error initializing services:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const user = await SafeAsync.execute(
        StorageService.getUserData,
        null
      );
      setUserData(user);
    } catch (error) {
      SafeConsole.error('Error loading user data:', error);
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
    return SafeAccess.getString(name, 'U').split(' ').map(word => SafeAccess.getString(word[0], 'U')).join('').toUpperCase().slice(0, 2);
  };

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
        {/* User Profile Section */}
        <View style={styles.userInfoSection}>
          <View style={styles.userInfo}>
            <Avatar.Text 
              size={60} 
              label={userData ? getInitials(SafeAccess.get(userData, 'username')) : 'U'}
              style={[
                styles.avatar,
                { backgroundColor: SafeAccess.get(userData, 'role') === USER_ROLES.ADMIN ? Colors.primary : Colors.secondary }
              ]}
            />
            <View style={styles.userDetails}>
              <Title style={styles.title}>{SafeAccess.get(userData, 'username', 'User')}</Title>
              <Caption style={styles.caption}>
                {SafeAccess.get(userData, 'buildingId', 'N/A')}-{SafeAccess.get(userData, 'houseNumber', 'N/A')}
              </Caption>
              <Caption style={styles.phone}>
                {SafeAccess.get(userData, 'countryCode', '')} {SafeAccess.get(userData, 'mobileNumber', '')}
              </Caption>
              {SafeAccess.get(userData, 'role') && (
                <Chip 
                  mode="outlined" 
                  style={[
                    styles.roleChip,
                    { borderColor: SafeAccess.get(userData, 'role') === USER_ROLES.ADMIN ? Colors.primary : Colors.secondary }
                  ]}
                  textStyle={[
                    styles.roleText,
                    { color: SafeAccess.get(userData, 'role') === USER_ROLES.ADMIN ? Colors.primary : Colors.secondary }
                  ]}
                >
                  {SafeAccess.get(userData, 'role') === USER_ROLES.ADMIN ? 'Secretary' : 'Member'}
                </Chip>
              )}
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
              <Ionicons name="receipt-outline" color={color} size={size} />
            )}
            label="Payment Receipts"
            onPress={() => props.navigation.navigate('PaymentReceipts')}
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

          {/* Admin Options - Only visible to admin users */}
          {userData?.role === USER_ROLES.ADMIN && (
            <>
              <DrawerItem
                icon={({ color, size }) => (
                  <Ionicons name="people-outline" color={Colors.primary} size={size} />
                )}
                label="Account Requests"
                onPress={() => props.navigation.navigate('AccountRequests')}
                labelStyle={[styles.drawerLabel, styles.adminLabel]}
              />
              
              <DrawerItem
                icon={({ color, size }) => (
                  <Ionicons name="shield-outline" color={Colors.primary} size={size} />
                )}
                label="Admin Console"
                onPress={() => props.navigation.navigate('AdminConsole')}
                labelStyle={[styles.drawerLabel, styles.adminLabel]}
              />
            </>
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
        name="PaymentReceipts" 
        component={PaymentReceiptsScreen}
        options={{
          title: 'Payment Receipts',
          headerTitle: 'Payment Receipts',
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

      <DrawerNav.Screen 
        name="AccountRequests" 
        component={AccountRequestsScreen}
        options={{
          title: 'Account Requests',
          headerTitle: 'Account Requests',
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
  roleChip: {
    marginTop: Layout.spacing.xs,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
  },
  drawerSection: {
    marginTop: Layout.spacing.md,
  },
  adminSection: {
    backgroundColor: Colors.lightGray,
    marginHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.sm,
    paddingVertical: Layout.spacing.xs,
  },
  drawerLabel: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
  },
  adminLabel: {
    color: Colors.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    backgroundColor: Colors.lightGray,
  },
  bottomDrawerSection: {
    marginBottom: Layout.spacing.md,
    borderTopColor: Colors.lightGray,
    borderTopWidth: 1,
    paddingTop: Layout.spacing.md,
  },
});

export default MainDrawerNavigator;
