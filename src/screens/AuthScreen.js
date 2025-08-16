import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { validateUsername, validateMobileNumber, validatePassword } from '../utils/validation';
import StorageService from '../services/storage';
import DatabaseService from '../services/database';
import { useToast } from '../context/ToastContext';

const AuthScreen = ({ navigation, route }) => {
  const { buildingId } = route.params;
  const { showSuccess, showError } = useToast();
  
  const [isNewUser, setIsNewUser] = useState(false); // Default to login mode
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasExistingCredentials, setHasExistingCredentials] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  
  // Validation errors
  const [errors, setErrors] = useState({});

  // Generate house numbers: 1,2,3,101,102,103,104,105,106,201,202...till 403
  const generateHouseNumbers = () => {
    const numbers = ['1', '2', '3']; // Ground floor
    
    // Add floors 1-4 with numbers 01-06
    for (let floor = 1; floor <= 4; floor++) {
      for (let unit = 1; unit <= 6; unit++) {
        const houseNum = `${floor}${unit.toString().padStart(2, '0')}`;
        numbers.push(houseNum);
      }
    }
    
    return numbers.map(num => ({ label: `House ${num}`, value: num }));
  };

  const houseNumbers = generateHouseNumbers();

  // Country codes
  const countryCodes = [
    { label: 'India (+91)', value: '+91' },
    { label: 'USA (+1)', value: '+1' },
    { label: 'UK (+44)', value: '+44' },
    // Add more as needed
  ];

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      // Check for active session first
      const activeSession = await StorageService.getActiveSession();
      
      if (activeSession) {
        // User has an active session, get user data and navigate to main immediately
        const userData = await StorageService.getUserData();
        if (userData) {
          console.log('Auto-login successful for user:', userData.username);
          // Use replace to prevent going back to auth screen
          navigation.replace('Main');
          return;
        }
      }

      // No active session, check for saved credentials for easy login
      const credentials = await StorageService.getCredentials();
      const userData = await StorageService.getUserData();
      
      if (credentials && userData) {
        // User exists, pre-fill form and set to login mode
        console.log('Loading user data:', userData);
        setUsername(userData.username || '');
        setCountryCode(userData.countryCode || '+91');
        setMobileNumber(userData.mobileNumber || '');
        setIsNewUser(false); // Set to login mode
        setHasExistingCredentials(true); // Mark that we have existing credentials
        console.log('Pre-filled values:', {
          username: userData.username,
          countryCode: userData.countryCode,
          mobileNumber: userData.mobileNumber
        });
      } else {
        console.log('No saved credentials found - switching to signup mode');
        setIsNewUser(true); // Switch to signup mode if no saved credentials
        setHasExistingCredentials(false);
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    } finally {
      // Only set loading to false if we're not navigating away
      setInitialLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (isNewUser || (!isNewUser && !hasExistingCredentials)) {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.isValid) {
        newErrors.username = usernameValidation.message;
      }

      const mobileValidation = validateMobileNumber(mobileNumber);
      if (!mobileValidation) {
        newErrors.mobileNumber = 'Please enter a valid mobile number';
      }

      // House number validation for new users
      if (isNewUser && !houseNumber) {
        newErrors.houseNumber = 'Please select your house number';
      }
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isNewUser) {
        await handleSignup();
      } else {
        await handleLogin();
      }
    } catch (error) {
      showError(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    // Check if user already exists in database
    const existingUser = await DatabaseService.getUserByMobile(countryCode, mobileNumber);
    
    if (existingUser.success) {
      showError('A user with this mobile number already exists. Please login instead.');
      return;
    }

    // Create new user
    const userData = {
      username,
      countryCode,
      mobileNumber,
      houseNumber,
      buildingId,
      password, // Note: In production, hash this password
    };

    const result = await DatabaseService.createUser(userData);
    
    if (result.success) {
      // Create user data object with ID
      const fullUserData = { ...userData, id: result.id };
      
      // Save user data
      await StorageService.saveUserData(fullUserData);
      
      // Save credentials
      await StorageService.saveCredentials({
        countryCode,
        mobileNumber,
        password,
      });

      // Create session for automatic login
      await StorageService.createSession(fullUserData);

      showSuccess('Account created successfully! Welcome to Karnavati Apartment!');
      setTimeout(() => navigation.replace('Main'), 1000);
    } else {
      throw new Error(result.error);
    }
  };

  const handleLogin = async () => {
    // Get user from database
    const result = await DatabaseService.getUserByMobile(countryCode, mobileNumber);
    
    if (!result.success) {
      showError('User not found. Please check your mobile number.');
      return;
    }

    // Verify password (Note: In production, compare hashed passwords)
    if (result.data.password !== password) {
      showError('Invalid password. Please try again.');
      return;
    }

    // Save/update user data
    await StorageService.saveUserData(result.data);

    // Update credentials
    await StorageService.saveCredentials({
      countryCode,
      mobileNumber,
      password,
    });

    // Create session for automatic login
    await StorageService.createSession(result.data);

    showSuccess(`Welcome back${result.data.username ? `, ${result.data.username}` : ''}!`);
    setTimeout(() => navigation.replace('Main'), 1000);
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Checking user data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Title style={styles.title}>
              {isNewUser ? 'Create Account' : 'Welcome Back'}
            </Title>
            <Text style={styles.subtitle}>
              {isNewUser 
                ? `Register for Block ${buildingId}` 
                : hasExistingCredentials
                  ? 'Please enter your password to continue'
                  : 'Please enter your details to login'
              }
            </Text>
          </View>

          <Card style={styles.formCard}>
            <View style={styles.formContent}>
              {isNewUser && (
                <>
                  <TextInput
                    label="Username"
                    value={username}
                    onChangeText={setUsername}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.username}
                  />
                  <HelperText type="error" visible={!!errors.username}>
                    {errors.username}
                  </HelperText>

                  <View style={styles.mobileContainer}>
                    <View style={styles.countryCodeContainer}>
                      <Picker
                        selectedValue={countryCode}
                        onValueChange={setCountryCode}
                        style={styles.countryCodePicker}
                      >
                        {countryCodes.map(code => (
                          <Picker.Item 
                            key={code.value} 
                            label={code.label} 
                            value={code.value} 
                          />
                        ))}
                      </Picker>
                    </View>
                    
                    <TextInput
                      label="Mobile Number"
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.mobileInput}
                      error={!!errors.mobileNumber}
                    />
                  </View>
                  <HelperText type="error" visible={!!errors.mobileNumber}>
                    {errors.mobileNumber}
                  </HelperText>

                  <View style={styles.houseNumberContainer}>
                    <Text style={styles.fieldLabel}>House Number</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={houseNumber}
                        onValueChange={setHouseNumber}
                        style={styles.houseNumberPicker}
                      >
                        <Picker.Item label="Select your house number" value="" />
                        {houseNumbers.map(house => (
                          <Picker.Item 
                            key={house.value} 
                            label={house.label} 
                            value={house.value} 
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <HelperText type="error" visible={!!errors.houseNumber}>
                    {errors.houseNumber}
                  </HelperText>
                </>
              )}

              {!isNewUser && (
                <>
                  <TextInput
                    label="Username"
                    value={username || ''}
                    onChangeText={setUsername}
                    mode="outlined"
                    style={styles.input}
                    editable={!hasExistingCredentials}
                    right={hasExistingCredentials && username ? <TextInput.Icon icon="check" /> : null}
                    error={!!errors.username}
                  />
                  {!hasExistingCredentials && (
                    <HelperText type="error" visible={!!errors.username}>
                      {errors.username}
                    </HelperText>
                  )}

                  <View style={styles.mobileContainer}>
                    {!hasExistingCredentials && (
                      <View style={styles.countryCodeContainer}>
                        <Picker
                          selectedValue={countryCode}
                          onValueChange={setCountryCode}
                          style={styles.countryCodePicker}
                        >
                          {countryCodes.map(code => (
                            <Picker.Item 
                              key={code.value} 
                              label={code.label} 
                              value={code.value} 
                            />
                          ))}
                        </Picker>
                      </View>
                    )}
                    
                    <TextInput
                      label="Mobile Number"
                      value={hasExistingCredentials ? (mobileNumber ? `${countryCode} ${mobileNumber}` : '') : mobileNumber}
                      onChangeText={setMobileNumber}
                      mode="outlined"
                      keyboardType="numeric"
                      style={hasExistingCredentials ? styles.input : styles.mobileInput}
                      editable={!hasExistingCredentials}
                      right={hasExistingCredentials && mobileNumber ? <TextInput.Icon icon="check" /> : null}
                      error={!!errors.mobileNumber}
                    />
                  </View>
                  {!hasExistingCredentials && (
                    <HelperText type="error" visible={!!errors.mobileNumber}>
                      {errors.mobileNumber}
                    </HelperText>
                  )}
                </>
              )}

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                error={!!errors.password}
              />
              <HelperText type="error" visible={!!errors.password}>
                {errors.password}
              </HelperText>

              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                labelStyle={styles.submitButtonText}
                loading={loading}
                disabled={loading}
              >
                {isNewUser ? 'Create Account' : 'Login'}
              </Button>

              {!isNewUser && (
                <Button
                  mode="text"
                  onPress={() => setIsNewUser(true)}
                  style={styles.switchButton}
                  labelStyle={styles.switchButtonText}
                >
                  Create New Account
                </Button>
              )}

              {isNewUser && (
                <Button
                  mode="text"
                  onPress={() => setIsNewUser(false)}
                  style={styles.switchButton}
                  labelStyle={styles.switchButtonText}
                >
                  Already have an account? Login
                </Button>
              )}
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
    paddingTop: Layout.spacing.lg,
  },
  title: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    elevation: 3,
  },
  formContent: {
    padding: Layout.spacing.lg,
  },
  input: {
    marginBottom: Layout.spacing.xs,
    backgroundColor: Colors.surface,
  },
  mobileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  countryCodeContainer: {
    width: 100,
    marginRight: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: Layout.borderRadius.sm,
  },
  countryCodePicker: {
    height: 56,
  },
  mobileInput: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  houseNumberContainer: {
    marginBottom: Layout.spacing.xs,
  },
  fieldLabel: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.surface,
  },
  houseNumberPicker: {
    height: 56,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    marginTop: Layout.spacing.lg,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  submitButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
  switchButton: {
    marginTop: Layout.spacing.md,
  },
  switchButtonText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary,
  },
});

export default AuthScreen;
