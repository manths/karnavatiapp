import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  List,
  Switch,
  Divider,
  Avatar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import StorageService from '../services/storage';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [autoLogin, setAutoLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await StorageService.getUserData();
      const session = await StorageService.getActiveSession();
      
      if (user) {
        setUserData(user);
      }
      
      if (session) {
        setAutoLogin(true);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleAutoLoginToggle = async () => {
    try {
      const newValue = !autoLogin;
      setAutoLogin(newValue);
      await StorageService.setAutoLogin(newValue);
      
      if (!newValue) {
        // If auto-login is disabled, clear the session but keep user data
        await StorageService.clearSession();
      } else {
        // If auto-login is enabled, create a new session
        if (userData) {
          await StorageService.createSession(userData);
        }
      }
    } catch (error) {
      console.error('Error toggling auto login:', error);
      Alert.alert('Error', 'Failed to update auto-login setting');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      setLoading(true);
      
      // Clear all user data and session
      await StorageService.clearUserData();
      
      // Navigate back to building selection
      navigation.reset({
        index: 0,
        routes: [{ name: 'BuildingSelection' }],
      });
      
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to logout properly');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text 
              size={80} 
              label={getInitials(userData.username)}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Title style={styles.username}>{userData.username}</Title>
              <Text style={styles.buildingId}>{userData.buildingId}-{userData.houseNumber}</Text>
              <Text style={styles.mobile}>
                {userData.countryCode} {userData.mobileNumber}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Settings */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Settings</Title>
            
            <List.Item
              title="Auto Login"
              description="Stay signed in automatically"
              left={props => <List.Icon {...props} icon="login" />}
              right={() => (
                <Switch
                  value={autoLogin}
                  onValueChange={handleAutoLoginToggle}
                  color={Colors.primary}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="App Version"
              description="1.0.0"
              left={props => <List.Icon {...props} icon="information" />}
            />
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleLogout}
              loading={loading}
              disabled={loading}
              style={styles.logoutButton}
              buttonColor={Colors.error}
              textColor={Colors.white}
              icon="logout"
            >
              {loading ? 'Logging out...' : 'Logout'}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    padding: Layout.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    marginBottom: Layout.spacing.lg,
    elevation: 2,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: Colors.primary,
    marginRight: Layout.spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  buildingId: {
    fontSize: Layout.fontSize.md,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
  },
  mobile: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  settingsCard: {
    marginBottom: Layout.spacing.lg,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  actionsCard: {
    marginBottom: Layout.spacing.lg,
    elevation: 2,
  },
  logoutButton: {
    marginTop: Layout.spacing.sm,
  },
});

export default ProfileScreen;
