import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  Card,
  Button,
  Title,
  Paragraph,
  Avatar,
  IconButton,
  Chip,
  Divider,
} from 'react-native-paper';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { USER_STATUS } from '../constants/userRoles';
import { SafeAccess, SafeAsync, SafeConsole } from '../utils/safeAccess';
import StorageService from '../services/storage';
import DatabaseService from '../services/database';
import { useToast } from '../context/ToastContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AccountPendingScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    checkAccountStatus();
  }, []);

  const checkAccountStatus = async () => {
    try {
      const user = await SafeAsync.execute(StorageService.getUserData, null);
      if (user) {
        // Fetch latest user status from database
        const result = await SafeAsync.execute(
          () => DatabaseService.getUserById(SafeAccess.get(user, 'id')),
          { success: false }
        );
        
        if (result.success) {
          const updatedUser = result.data;
          setUserData(updatedUser);
          
          // Update local storage with latest data
          await StorageService.saveUserData(updatedUser);
          
          // If user is approved, navigate to main app
          if (SafeAccess.get(updatedUser, 'status') === USER_STATUS.APPROVED) {
            showSuccess('Your account has been approved! Welcome to Karnavati Apartment!');
            setTimeout(() => {
              navigation.replace('Main');
            }, 2000);
          } else if (SafeAccess.get(updatedUser, 'status') === USER_STATUS.REJECTED) {
            showError('Your account request has been rejected. Please contact the secretary.');
          }
        }
      }
    } catch (error) {
      SafeConsole.error('Error checking account status:', error);
      showError('Failed to check account status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    checkAccountStatus();
  };

  const handleLogout = async () => {
    try {
      await SafeAsync.execute(StorageService.clearUserData, null);
      await SafeAsync.execute(StorageService.clearCredentials, null);
      await SafeAsync.execute(StorageService.clearSession, null);
      navigation.replace('Auth', { buildingId: SafeAccess.get(userData, 'buildingId', 'A') });
    } catch (error) {
      SafeConsole.error('Error logging out:', error);
      showError('Failed to logout');
    }
  };

  const getStatusMessage = () => {
    const status = SafeAccess.get(userData, 'status', USER_STATUS.PENDING);
    switch (status) {
      case USER_STATUS.PENDING:
        return {
          title: 'Account Pending Approval',
          message: 'Your registration request has been submitted successfully. Our secretary will review your application and approve it soon.',
          subtitle: 'This usually takes 24-48 hours',
          icon: 'clock-outline',
          color: Colors.warning,
          backgroundColor: '#FFF3CD',
        };
      case USER_STATUS.REJECTED:
        return {
          title: 'Account Request Rejected',
          message: 'Your account request has been rejected by the secretary. Please contact them for more information or resubmit with correct details.',
          subtitle: 'Contact secretary for assistance',
          icon: 'close-circle-outline',
          color: Colors.error,
          backgroundColor: '#F8D7DA',
        };
      default:
        return {
          title: 'Checking Status...',
          message: 'Please wait while we check your account status.',
          subtitle: 'This may take a moment',
          icon: 'help-circle-outline',
          color: Colors.primary,
          backgroundColor: '#D1ECF1',
        };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Checking account status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusMessage();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: statusInfo.backgroundColor }]}>
          <View style={styles.headerContent}>
            <Avatar.Text
              size={screenWidth * 0.2}
              label={SafeAccess.getString(
                SafeAccess.get(userData, 'username', 'U').charAt(0).toUpperCase(),
                'U'
              )}
              style={[styles.avatar, { backgroundColor: statusInfo.color }]}
              labelStyle={styles.avatarLabel}
            />
            <Title style={styles.userName}>
              {SafeAccess.get(userData, 'username', 'User')}
            </Title>
            <Chip
              mode="outlined"
              style={[styles.userDetailsChip, { borderColor: statusInfo.color }]}
              textStyle={{ color: statusInfo.color, fontSize: 12 }}
            >
              {SafeAccess.get(userData, 'buildingId', 'N/A')}-{SafeAccess.get(userData, 'houseNumber', 'N/A')}
            </Chip>
            <Text style={styles.userMobile}>
              {SafeAccess.get(userData, 'countryCode', '')} {SafeAccess.get(userData, 'mobileNumber', '')}
            </Text>
          </View>
          
          <IconButton
            icon="logout"
            size={24}
            onPress={handleLogout}
            style={styles.logoutButton}
            iconColor={Colors.textSecondary}
          />
        </View>

        {/* Status Card */}
        <Card style={styles.statusCard} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.statusHeader}>
              <Avatar.Icon
                size={screenWidth * 0.15}
                icon={statusInfo.icon}
                style={[styles.statusIcon, { backgroundColor: statusInfo.color }]}
                color={Colors.white}
              />
              <View style={styles.statusTextContainer}>
                <Title style={[styles.statusTitle, { color: statusInfo.color }]}>
                  {statusInfo.title}
                </Title>
                {statusInfo.subtitle && (
                  <Text style={[styles.statusSubtitle, { color: statusInfo.color }]}>
                    {statusInfo.subtitle}
                  </Text>
                )}
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <Paragraph style={styles.statusMessage}>
              {statusInfo.message}
            </Paragraph>

            {SafeAccess.get(userData, 'status') === USER_STATUS.PENDING && (
              <View style={styles.pendingInfo}>
                <Text style={styles.pendingText}>
                  • Your registration details have been submitted
                </Text>
                <Text style={styles.pendingText}>
                  • Secretary will review your request
                </Text>
                <Text style={styles.pendingText}>
                  • You will receive notification upon approval
                </Text>
                <Text style={styles.pendingText}>
                  • Pull down to refresh and check status
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Contact Info */}
        <Card style={styles.contactCard}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.contactTitle}>Need Help?</Title>
            <Paragraph style={styles.contactText}>
              If you have any questions about your account status, please contact the secretary.
            </Paragraph>
            
            <View style={styles.contactInfo}>
              <Text style={styles.contactDetail}>📧 secretary@karnavati.com</Text>
              <Text style={styles.contactDetail}>📞 +91 98765 43210</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleRefresh}
            style={styles.refreshButton}
            labelStyle={styles.refreshButtonText}
            loading={refreshing}
          >
            Refresh Status
          </Button>
          
          <Button
            mode="text"
            onPress={handleLogout}
            style={styles.logoutTextButton}
            labelStyle={styles.logoutButtonText}
          >
            Login with Different Account
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: screenHeight * 0.02,
    fontSize: screenWidth * 0.04,
    color: Colors.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: screenWidth * 0.04,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: screenHeight * 0.03,
    backgroundColor: Colors.primary,
    padding: screenWidth * 0.05,
    paddingTop: screenHeight * 0.02,
    marginHorizontal: -screenWidth * 0.04,
    marginTop: -screenWidth * 0.04,
    borderBottomLeftRadius: screenWidth * 0.06,
    borderBottomRightRadius: screenWidth * 0.06,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  avatar: {
    marginBottom: screenHeight * 0.015,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  avatarLabel: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: screenWidth * 0.08,
  },
  userName: {
    fontSize: screenWidth * 0.055,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: screenHeight * 0.008,
    textAlign: 'center',
  },
  userDetails: {
    fontSize: screenWidth * 0.035,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: screenHeight * 0.008,
    textAlign: 'center',
  },
  userMobile: {
    fontSize: screenWidth * 0.032,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  logoutButton: {
    margin: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statusCard: {
    backgroundColor: Colors.surface,
    marginBottom: screenHeight * 0.025,
    elevation: 4,
    borderRadius: screenWidth * 0.04,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: screenWidth * 0.05,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: screenHeight * 0.025,
  },
  statusIcon: {
    marginBottom: screenHeight * 0.015,
    elevation: 2,
  },
  statusTitle: {
    textAlign: 'center',
    fontSize: screenWidth * 0.055,
    fontWeight: 'bold',
    marginBottom: screenHeight * 0.008,
  },
  statusMessage: {
    textAlign: 'center',
    fontSize: screenWidth * 0.04,
    color: Colors.textSecondary,
    lineHeight: screenWidth * 0.055,
    marginBottom: screenHeight * 0.025,
  },
  pendingInfo: {
    backgroundColor: 'rgba(139, 69, 19, 0.05)',
    padding: screenWidth * 0.04,
    borderRadius: screenWidth * 0.03,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  pendingText: {
    fontSize: screenWidth * 0.035,
    color: Colors.text,
    marginBottom: screenHeight * 0.008,
    lineHeight: screenWidth * 0.05,
  },
  contactCard: {
    backgroundColor: Colors.surface,
    marginBottom: screenHeight * 0.025,
    elevation: 4,
    borderRadius: screenWidth * 0.04,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contactTitle: {
    fontSize: screenWidth * 0.05,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: screenHeight * 0.012,
    textAlign: 'center',
  },
  contactText: {
    fontSize: screenWidth * 0.04,
    color: Colors.textSecondary,
    marginBottom: screenHeight * 0.02,
    textAlign: 'center',
    lineHeight: screenWidth * 0.055,
  },
  contactInfo: {
    backgroundColor: 'rgba(139, 69, 19, 0.05)',
    padding: screenWidth * 0.04,
    borderRadius: screenWidth * 0.03,
    alignItems: 'center',
  },
  contactDetail: {
    fontSize: screenWidth * 0.038,
    color: Colors.text,
    marginBottom: screenHeight * 0.008,
    textAlign: 'center',
  },
  actions: {
    marginTop: screenHeight * 0.025,
  },
  refreshButton: {
    borderColor: Colors.primary,
    marginBottom: screenHeight * 0.015,
    borderRadius: screenWidth * 0.025,
    paddingVertical: screenHeight * 0.005,
  },
  refreshButtonText: {
    color: Colors.primary,
    fontSize: screenWidth * 0.04,
  },
  logoutTextButton: {
    marginTop: screenHeight * 0.01,
    paddingVertical: screenHeight * 0.005,
  },
  logoutButtonText: {
    color: Colors.textSecondary,
    fontSize: screenWidth * 0.035,
  },
});

export default AccountPendingScreen;
