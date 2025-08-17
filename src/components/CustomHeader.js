import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { USER_ROLES } from '../constants/userRoles';
import StorageService from '../services/storage';

const CustomHeader = ({ title }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await StorageService.getUserData();
      setUserData(user);
    } catch (error) {
      console.error('Error loading user data for header:', error);
    }
  };

  const getHeaderTitle = () => {
    if (userData) {
      return `${userData.username} - ${userData.buildingId}-${userData.houseNumber}`;
    }
    return title || 'My Tickets';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = () => {
    if (userData?.role === USER_ROLES.ADMIN) {
      return Colors.primary;
    }
    return Colors.secondary;
  };

  return (
    <View style={styles.headerContainer}>
      {userData && (
        <Avatar.Text 
          size={32}
          label={getInitials(userData.username)}
          style={[styles.avatar, { backgroundColor: getAvatarColor() }]}
          labelStyle={styles.avatarLabel}
        />
      )}
      <Text style={styles.headerText}>
        {userData ? 'Hi, ' : ''}{getHeaderTitle()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  avatar: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  avatarLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.white,
  },
  headerText: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    flex: 1,
  },
});

export default CustomHeader;
