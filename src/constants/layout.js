import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Layout = {
  window: {
    width,
    height,
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  
  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
  
  // Icon sizes
  iconSize: {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 40,
  },
  
  // Button dimensions
  button: {
    height: 48,
    borderRadius: 8,
  },
  
  // Card dimensions
  card: {
    borderRadius: 12,
    elevation: 2,
  },
  
  // Header height
  header: {
    height: 56,
  },
};

export const isSmallDevice = width < 375;
export const isTablet = width >= 768;
