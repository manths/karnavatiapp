import React from 'react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { Colors } from '../constants/colors';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    accent: Colors.secondary,
    background: Colors.background,
    surface: Colors.surface,
    text: Colors.text,
    placeholder: Colors.textSecondary,
    backdrop: 'rgba(0, 0, 0, 0.5)',
    onSurface: Colors.text,
    notification: Colors.primary,
  },
  roundness: 8,
};

const ThemeProvider = ({ children }) => {
  return (
    <PaperProvider theme={theme}>
      {children}
    </PaperProvider>
  );
};

export default ThemeProvider;
