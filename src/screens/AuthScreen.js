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
  Modal,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  HelperText,
  ActivityIndicator,
  List,
  Divider,
} from 'react-native-paper';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { USER_STATUS, USER_ROLES } from '../constants/userRoles';
import { validateUsername, validateMobileNumber, validatePassword } from '../utils/validation';
import { SafeAccess, SafeAsync, SafeConsole } from '../utils/safeAccess';
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

  // Dropdown states
  const [showCountryCodeModal, setShowCountryCodeModal] = useState(false);
  const [showHouseNumberModal, setShowHouseNumberModal] = useState(false);

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
    
    return numbers.map(num => ({ 
      label: `${buildingId}-${num}`, 
      value: num,
      displayText: `${buildingId}-${num}`
    }));
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
      const activeSession = await SafeAsync.execute(
        StorageService.getActiveSession,
        null
      );
      
      if (activeSession) {
        // User has an active session, get user data and navigate to main immediately
        const userData = await SafeAsync.execute(
          StorageService.getUserData,
          null
        );
        if (userData) {
          SafeConsole.log('Auto-login successful for user:', SafeAccess.get(userData, 'username', 'unknown'));
          // Use replace to prevent going back to auth screen
          navigation.replace('Main');
          return;
        }
      }

      // No active session, check for saved credentials for easy login
      const credentials = await SafeAsync.execute(
        StorageService.getCredentials,
        null
      );
      const userData = await SafeAsync.execute(
        StorageService.getUserData,
        null
      );
      
      if (credentials && userData) {
        // User exists, pre-fill form and set to login mode
        SafeConsole.log('Loading user data:', userData);
        setUsername(SafeAccess.get(userData, 'username', ''));
        setCountryCode(SafeAccess.get(userData, 'countryCode', '+91'));
        setMobileNumber(SafeAccess.get(userData, 'mobileNumber', ''));
        setIsNewUser(false); // Set to login mode
        setHasExistingCredentials(true); // Mark that we have existing credentials
        SafeConsole.log('Pre-filled values:', {
          username: SafeAccess.get(userData, 'username'),
          countryCode: SafeAccess.get(userData, 'countryCode'),
          mobileNumber: SafeAccess.get(userData, 'mobileNumber')
        });
      } else {
        SafeConsole.log('No saved credentials found - switching to signup mode');
        setIsNewUser(true); // Switch to signup mode if no saved credentials
        setHasExistingCredentials(false);
      }
    } catch (error) {
      SafeConsole.error('Error checking existing session:', error);
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
      if (!mobileValidation.isValid) {
        newErrors.mobileNumber = mobileValidation.message;
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

    // Create new user with pending status
    const userData = {
      username,
      countryCode,
      mobileNumber,
      houseNumber,
      buildingId,
      password, // Note: In production, hash this password
      role: USER_ROLES.MEMBER, // Default role is member
      status: USER_STATUS.PENDING, // Default status is pending approval
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

      showSuccess('Account request submitted successfully! Please wait for secretary approval.');
      
      // Navigate to pending screen instead of main app
      setTimeout(() => navigation.replace('AccountPending'), 1000);
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

    // Check user status and role with safe fallbacks
    const userStatus = SafeAccess.get(result.data, 'status', USER_STATUS.PENDING);
    const userRole = SafeAccess.get(result.data, 'role', USER_ROLES.MEMBER);
    
    SafeConsole.log('Login attempt - User data:', {
      username: SafeAccess.get(result.data, 'username'),
      role: userRole,
      status: userStatus,
      id: SafeAccess.get(result.data, 'id')
    });
    
    if (userStatus === USER_STATUS.REJECTED) {
      showError('Your account request has been rejected. Please contact the secretary.');
      return;
    }

    // Save/update user data with safe fallbacks
    const userDataToSave = {
      ...result.data,
      status: userStatus,
      role: userRole,
    };
    await StorageService.saveUserData(userDataToSave);

    // Update credentials
    await StorageService.saveCredentials({
      countryCode,
      mobileNumber,
      password,
    });

    // Create session for automatic login
    await StorageService.createSession(result.data);

    // Navigate based on user status - Admin users bypass approval
    if (userRole === USER_ROLES.ADMIN) {
      const welcomeMessage = SafeAccess.get(result.data, 'firstLogin', true) !== false 
        ? `Welcome Admin${SafeAccess.get(result.data, 'username') ? `, ${SafeAccess.get(result.data, 'username')}` : ''}!`
        : `Welcome back Admin${SafeAccess.get(result.data, 'username') ? `, ${SafeAccess.get(result.data, 'username')}` : ''}!`;
      
      showSuccess(welcomeMessage);
      
      // Mark first login as complete for admin
      if (SafeAccess.get(result.data, 'firstLogin', true) !== false) {
        await DatabaseService.updateUser(SafeAccess.get(result.data, 'id'), { firstLogin: false });
      }
      
      setTimeout(() => navigation.replace('Main'), 1000);
    } else if (userStatus === USER_STATUS.PENDING) {
      showSuccess('Logged in successfully. Your account is pending approval.');
      setTimeout(() => navigation.replace('AccountPending'), 1000);
    } else if (userStatus === USER_STATUS.APPROVED) {
      const welcomeMessage = SafeAccess.get(result.data, 'firstLogin', true) !== false 
        ? `Your account has been approved! Welcome${SafeAccess.get(result.data, 'username') ? `, ${SafeAccess.get(result.data, 'username')}` : ''}!`
        : `Welcome back${SafeAccess.get(result.data, 'username') ? `, ${SafeAccess.get(result.data, 'username')}` : ''}!`;
      
      showSuccess(welcomeMessage);
      
      // Mark first login as complete
      if (SafeAccess.get(result.data, 'firstLogin', true) !== false) {
        await DatabaseService.updateUser(SafeAccess.get(result.data, 'id'), { firstLogin: false });
      }
      
      setTimeout(() => navigation.replace('Main'), 1000);
    }
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
                    <View style={styles.countryCodeWrapper}>
                      <Text style={styles.fieldLabel}>Country</Text>
                      <TouchableOpacity 
                        style={styles.countryCodeContainer}
                        onPress={() => setShowCountryCodeModal(true)}
                      >
                        <View style={styles.countryCodePicker}>
                          <Text style={styles.countryCodeText}>
                            {countryCode}
                          </Text>
                          <Text style={styles.dropdownIcon}>▼</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.mobileNumberWrapper}>
                      <Text style={styles.fieldLabel}>Mobile Number</Text>
                      <TextInput
                        value={mobileNumber}
                        onChangeText={setMobileNumber}
                        mode="outlined"
                        keyboardType="numeric"
                        style={styles.mobileInput}
                        placeholder="Enter 10-digit mobile number"
                        error={!!errors.mobileNumber}
                        maxLength={10}
                      />
                    </View>
                  </View>
                  <HelperText type="error" visible={!!errors.mobileNumber}>
                    {errors.mobileNumber}
                  </HelperText>

                  <View style={styles.houseNumberContainer}>
                    <Text style={styles.fieldLabel}>House Number</Text>
                    <TouchableOpacity 
                      style={styles.pickerContainer}
                      onPress={() => setShowHouseNumberModal(true)}
                    >
                      <View style={styles.houseNumberPicker}>
                        <Text style={styles.houseNumberText}>
                          {houseNumber ? `${buildingId}-${houseNumber}` : 'Select your house number'}
                        </Text>
                      </View>
                    </TouchableOpacity>
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
                      <TouchableOpacity 
                        style={styles.countryCodeContainer}
                        onPress={() => setShowCountryCodeModal(true)}
                      >
                        <View style={styles.countryCodePicker}>
                          <Text style={styles.countryCodeText}>
                            {countryCodes.find(code => code.value === countryCode)?.label || '+91'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    
                    <View style={hasExistingCredentials ? styles.input : styles.mobileNumberWrapper}>
                      <TextInput
                        label="Mobile Number"
                        value={hasExistingCredentials ? (mobileNumber ? `${countryCode} ${mobileNumber}` : '') : mobileNumber}
                        onChangeText={setMobileNumber}
                        mode="outlined"
                        keyboardType="numeric"
                        style={styles.mobileInput}
                        editable={!hasExistingCredentials}
                        right={hasExistingCredentials && mobileNumber ? <TextInput.Icon icon="check" /> : null}
                        error={!!errors.mobileNumber}
                      />
                    </View>
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

      {/* Country Code Modal */}
      <Modal
        visible={showCountryCodeModal}
        animationType="slide"
        onRequestClose={() => setShowCountryCodeModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Title style={styles.modalTitle}>Select Country Code</Title>
            <Button 
              onPress={() => setShowCountryCodeModal(false)}
              mode="text"
            >
              Cancel
            </Button>
          </View>
          <FlatList
            data={countryCodes}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setCountryCode(item.value);
                  setShowCountryCodeModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.label}</Text>
                {countryCode === item.value && (
                  <Text style={styles.selectedIndicator}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* House Number Modal */}
      <Modal
        visible={showHouseNumberModal}
        animationType="slide"
        onRequestClose={() => setShowHouseNumberModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Title style={styles.modalTitle}>Select House Number</Title>
            <Button 
              onPress={() => setShowHouseNumberModal(false)}
              mode="text"
            >
              Cancel
            </Button>
          </View>
          <FlatList
            data={houseNumbers}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setHouseNumber(item.value);
                  setShowHouseNumberModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.displayText}</Text>
                {houseNumber === item.value && (
                  <Text style={styles.selectedIndicator}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            numColumns={2}
            columnWrapperStyle={styles.modalRow}
          />
        </SafeAreaView>
      </Modal>
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
    alignItems: 'flex-end',
    marginBottom: Layout.spacing.xs,
    gap: Layout.spacing.md,
  },
  countryCodeWrapper: {
    width: 100,
  },
  countryCodeContainer: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface,
    height: 56,
  },
  countryCodePicker: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
  },
  countryCodeText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  dropdownIcon: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  mobileNumberWrapper: {
    flex: 1,
  },
  mobileInput: {
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
  // New dropdown styles
  countryCodeText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.md,
  },
  houseNumberText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.md,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  modalTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    flex: 1,
    margin: Layout.spacing.xs,
  },
  modalItemText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
  },
  selectedIndicator: {
    fontSize: Layout.fontSize.lg,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  modalRow: {
    justifyContent: 'space-around',
  },
});

export default AuthScreen;
