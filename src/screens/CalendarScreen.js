import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Title, Button, Card } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';

const CalendarScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card} elevation={3}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📅</Text>
            </View>
            
            <Title style={styles.title}>Calendar Feature</Title>
            
            <Text style={styles.subtitle}>Under Development</Text>
            
            <Text style={styles.description}>
              The calendar feature is currently being developed. 
              This will include:
            </Text>
            
            <View style={styles.featuresList}>
              <Text style={styles.featureItem}>• Society event notifications</Text>
              <Text style={styles.featureItem}>• Maintenance schedules</Text>
              <Text style={styles.featureItem}>• Meeting reminders</Text>
              <Text style={styles.featureItem}>• Important dates</Text>
              <Text style={styles.featureItem}>• Facility booking calendar</Text>
            </View>
            
            <Text style={styles.comingSoon}>Coming Soon!</Text>
            
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              labelStyle={styles.backButtonText}
            >
              Go Back
            </Button>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
  },
  cardContent: {
    padding: Layout.spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Layout.spacing.lg,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Layout.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Layout.fontSize.lg,
    color: Colors.warning,
    fontWeight: '600',
    marginBottom: Layout.spacing.lg,
    textAlign: 'center',
  },
  description: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.lg,
  },
  featuresList: {
    alignSelf: 'stretch',
    marginBottom: Layout.spacing.xl,
  },
  featureItem: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: Layout.spacing.xs,
  },
  comingSoon: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.success,
    marginBottom: Layout.spacing.xl,
    textAlign: 'center',
  },
  backButton: {
    borderColor: Colors.primary,
    paddingHorizontal: Layout.spacing.lg,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: Layout.fontSize.md,
  },
});

export default CalendarScreen;
