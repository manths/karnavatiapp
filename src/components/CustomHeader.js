import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
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
      return `Hi, ${userData.username} - Block ${userData.buildingId}`;
    }
    return title || 'My Tickets';
  };

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>{getHeaderTitle()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
  },
  headerText: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
  },
});

export default CustomHeader;
