import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  message: {
    marginTop: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default LoadingScreen;
