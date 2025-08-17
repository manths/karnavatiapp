import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeConsole } from '../utils/safeAccess';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static isExpoGo() {
    return Constants.appOwnership === 'expo';
  }

  // Check if permissions were already granted
  static async hasNotificationPermissions() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      SafeConsole.error('Error checking notification permissions:', error);
      return false;
    }
  }

  static async requestPermissions() {
    try {
      SafeConsole.log('🔔 Checking notification permissions...');
      
      // Check if we already have permissions
      const hasPermissions = await this.hasNotificationPermissions();
      if (hasPermissions) {
        SafeConsole.log('✅ Notification permissions already granted');
        return true;
      }

      // Check if we've already asked before
      const hasAskedBefore = await AsyncStorage.getItem('notificationPermissionAsked');
      
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Karnavati App Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Request permissions directly without showing modal
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';

      // Remember that we asked
      await AsyncStorage.setItem('notificationPermissionAsked', 'true');

      if (granted) {
        SafeConsole.log('✅ Notification permissions granted');
        return true;
      } else {
        SafeConsole.warn('❌ Notification permissions denied');
        return false;
      }
    } catch (error) {
      SafeConsole.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Request SMS permissions for Android
  static async requestSMSPermissions() {
    try {
      if (Platform.OS !== 'android') {
        return { granted: false, error: 'SMS reading only available on Android' };
      }

      // Check if we already asked before
      const hasAskedBefore = await AsyncStorage.getItem('smsPermissionAsked');
      if (hasAskedBefore === 'true') {
        return { granted: false, alreadyAsked: true };
      }

      SafeConsole.log('📱 Requesting SMS permissions...');
      
      // Note: This requires native Android implementation
      // For now, we'll mark that we attempted to ask
      await AsyncStorage.setItem('smsPermissionAsked', 'true');
      
      return { 
        granted: false, 
        error: 'SMS permissions require native Android implementation. This is a placeholder.',
        simulated: true 
      };
    } catch (error) {
      SafeConsole.error('Error requesting SMS permissions:', error);
      return { granted: false, error: error.message };
    }
  }

  // Initialize all permissions
  static async initializePermissions() {
    try {
      const results = {
        notifications: await this.requestPermissions(),
        sms: await this.requestSMSPermissions(),
      };

      SafeConsole.log('Permission initialization results:', results);
      return results;
    } catch (error) {
      SafeConsole.error('Error initializing permissions:', error);
      return {
        notifications: false,
        sms: { granted: false, error: error.message },
      };
    }
  }

  static async getExpoPushToken() {
    try {
      // Check if running in Expo Go
      if (this.isExpoGo()) {
        SafeConsole.warn('⚠️ Push notifications not supported in Expo Go (SDK 53+)');
        SafeConsole.log('💡 Use development build for full notification support');
        return null;
      }

      // For development builds, try to get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        SafeConsole.warn('⚠️ No projectId found in app.json');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      })).data;
      
      SafeConsole.log('📱 Expo push token:', token);
      return token;
    } catch (error) {
      SafeConsole.error('Error getting Expo push token:', error);
      SafeConsole.log('💡 This is normal in Expo Go. Use development build for push notifications.');
      return null;
    }
  }

  static async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });
      SafeConsole.log('📨 Local notification sent:', title);
    } catch (error) {
      SafeConsole.error('Error sending local notification:', error);
    }
  }

  static async showPermissionDialog() {
    return new Promise((resolve) => {
      const isExpoGo = this.isExpoGo();
      const title = isExpoGo ? '🔔 Local Notifications' : '🔔 Enable Notifications';
      const message = isExpoGo 
        ? 'Enable local notifications for account updates and important alerts.\n\n⚠️ Push notifications require a development build.'
        : 'Stay updated! Enable notifications to receive:\n\n• Account approval status\n• Important announcements\n• Maintenance reminders\n• Ticket updates';

      Alert.alert(
        title,
        message,
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Enable',
            onPress: () => resolve(true),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });
  }

  static async initializeNotifications() {
    try {
      SafeConsole.log('🚀 Initializing notification service...');
      
      const isExpoGo = this.isExpoGo();
      if (isExpoGo) {
        SafeConsole.log('📱 Running in Expo Go - limited notification support');
      }
      
      // Show permission dialog
      const userWantsNotifications = await this.showPermissionDialog();
      
      if (!userWantsNotifications) {
        SafeConsole.log('📵 User declined notifications');
        return { success: false, reason: 'user_declined' };
      }

      // Request permissions
      const permissionGranted = await this.requestPermissions();
      
      if (!permissionGranted) {
        SafeConsole.log('❌ Permissions not granted');
        return { success: false, reason: 'permission_denied' };
      }

      // Try to get push token (will be null in Expo Go)
      const pushToken = await this.getExpoPushToken();
      
      if (!pushToken && !isExpoGo) {
        SafeConsole.log('⚠️ Could not get push token in development build');
        return { 
          success: true, 
          reason: 'no_token', 
          message: 'Local notifications enabled. Push notifications may need additional setup.' 
        };
      }

      const message = isExpoGo 
        ? 'Local notifications enabled! Use development build for push notifications.'
        : 'Notifications enabled successfully!';

      SafeConsole.log('✅ Notification service initialized successfully');
      return { 
        success: true, 
        pushToken,
        isExpoGo,
        message
      };
    } catch (error) {
      SafeConsole.error('Error initializing notifications:', error);
      return { success: false, reason: 'error', error };
    }
  }

  // Notification templates for different events
  static notifications = {
    accountApproved: {
      title: '✅ Account Approved!',
      body: 'Welcome to Karnavati Apartment! Your account has been approved and you can now access all features.',
    },
    accountRejected: {
      title: '❌ Account Application',
      body: 'Your account application needs review. Please contact the secretary for more information.',
    },
    newRegistration: (username, buildingId, houseNumber) => ({
      title: '👤 New Registration',
      body: `${username} from ${buildingId}-${houseNumber} has registered and needs approval.`,
    }),
    ticketUpdate: (ticketId, status) => ({
      title: '🎫 Ticket Update',
      body: `Your ticket #${ticketId} status has been updated to: ${status}`,
    }),
    maintenanceReminder: (amount, dueDate) => ({
      title: '💰 Maintenance Due',
      body: `Maintenance payment of ₹${amount} is due on ${dueDate}`,
    }),
  };
}

export default NotificationService;
