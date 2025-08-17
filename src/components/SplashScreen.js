import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { USER_STATUS } from '../constants/userRoles';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ userName, userStatus, onComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-complete after 3 seconds
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, slideAnim, onComplete]);

  const getWelcomeMessage = () => {
    if (!userName) {
      return {
        welcome: 'Welcome',
        subtitle: 'to the Karnavati Apartment',
      };
    }

    switch (userStatus) {
      case USER_STATUS.PENDING:
        return {
          welcome: `Welcome ${userName}`,
          subtitle: 'Your account is pending approval',
        };
      case USER_STATUS.APPROVED:
        return {
          welcome: `Welcome back ${userName}`,
          subtitle: 'to the Karnavati Apartment',
        };
      case USER_STATUS.REJECTED:
        return {
          welcome: `Hello ${userName}`,
          subtitle: 'Please contact secretary for assistance',
        };
      default:
        return {
          welcome: `Welcome ${userName}`,
          subtitle: 'to the Karnavati Apartment',
        };
    }
  };

  const welcomeMessage = getWelcomeMessage();

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🏢</Text>
        </View>
        
        <Text style={styles.welcomeText}>
          {welcomeMessage.welcome}
        </Text>
        
        <Text style={styles.apartmentText}>
          {welcomeMessage.subtitle}
        </Text>
        
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  iconContainer: {
    marginBottom: Layout.spacing.xl,
  },
  icon: {
    fontSize: 80,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: Layout.fontSize.xxl + 4,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  apartmentText: {
    fontSize: Layout.fontSize.lg,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: Layout.spacing.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
});

export default SplashScreen;
