import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  HelperText,
  ActivityIndicator,
  Divider,
  IconButton,
} from 'react-native-paper';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { APP_CONFIG } from '../constants/config';
import { PRODUCTION_CONFIG, ProductionUtils } from '../constants/production';
import { validateAmount } from '../utils/validation';
import { formatCurrency, generateTransactionId, createUPIUrl } from '../utils/helpers';
import DatabaseService from '../services/database';
import StorageService from '../services/storage';
import SMSService from '../services/smsService';
import { useToast } from '../context/ToastContext';

const PaymentScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const { showSuccess, showError } = useToast();
  
  // Form fields
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Monthly Maintenance');
  const [transactionId, setTransactionId] = useState('');
  
  // Validation errors
  const [errors, setErrors] = useState({});
  
  // Payment states
  const [paymentStep, setPaymentStep] = useState('enter_amount'); // enter_amount, payment_options, payment_success
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);

  const upiApps = [
    { name: 'Google Pay', package: 'com.google.android.apps.nbu.paisa.user', icon: '💳' },
    { name: 'PhonePe', package: 'com.phonepe.app', icon: '📱' },
    { name: 'Paytm', package: 'net.one97.paytm', icon: '💰' },
    { name: 'CRED', package: 'com.dreamplug.androidapp', icon: '💎' },
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  // Reset payment state when screen comes into focus (except on first load)
  useFocusEffect(
    React.useCallback(() => {
      // Only reset if we're in success state and coming back to the screen
      if (paymentStep === 'payment_success') {
        setTimeout(() => {
          resetPayment();
        }, 100); // Small delay to ensure smooth navigation
      }
    }, [paymentStep])
  );

  const loadUserData = async () => {
    const user = await StorageService.getUserData();
    setUserData(user);
  };

  const validateForm = () => {
    const newErrors = {};

    const amountValidation = validateAmount(amount);
    if (!amountValidation.isValid) {
      newErrors.amount = amountValidation.message;
    }

    if (description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToPayment = () => {
    if (!validateForm()) return;
    if (!userData) {
      showError('User data not found');
      return;
    }

    const txnId = generateTransactionId();
    setTransactionId(txnId);
    setPaymentStep('payment_options');
  };

  const handleUPIPayment = async (upiApp) => {
    try {
      const upiUrl = createUPIUrl(
        APP_CONFIG.upi.id,
        parseFloat(amount),
        APP_CONFIG.upi.payeeName,
        transactionId
      );

      ProductionUtils.log(`Attempting to open UPI payment for ${upiApp.name}`, 'info');
      
      // Use production-safe UPI opening
      const result = await ProductionUtils.openUPIUrl(upiUrl, upiApp.name);
      
      if (result.success) {
        showSuccess(`Opening ${upiApp.name} for payment...`);
        
        // Show success confirmation after a delay
        setTimeout(() => {
          showPaymentConfirmation();
        }, 2000);
      } else {
        showError(result.error || `Unable to open ${upiApp.name}. Please ensure it's installed and try again.`);
      }

    } catch (error) {
      ProductionUtils.logError(error, 'UPI Payment');
      showError('Failed to open payment app. Please try again.');
    }
  };

  const showPaymentConfirmation = () => {
    showSuccess('Payment initiated successfully! Please complete the payment in your UPI app.');
    
    // Auto-navigate back after showing success
    setTimeout(() => {
      handlePaymentSuccess();
    }, 3000);
  };

  const handlePaymentSuccess = async () => {
    setLoading(true);

    try {
      const paymentData = {
        userId: userData.id,
        username: userData.username,
        buildingId: userData.buildingId,
        houseNumber: userData.houseNumber,
        amount: parseFloat(amount),
        description: description.trim(),
        transactionId,
        paymentMethod: 'UPI',
        upiId: APP_CONFIG.upi.id,
        status: 'pending', // Will be verified through SMS or admin
        expectedAmount: parseFloat(amount),
        expectedUPIId: APP_CONFIG.upi.id,
      };

      const result = await DatabaseService.savePaymentWithSMS(paymentData, null);
      
      if (result.success) {
        setPaymentStep('payment_success');
        showSuccess('Payment recorded with pending status. It will be verified and approved by admin.');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      showError('Failed to record payment. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const resetPayment = () => {
    setAmount('');
    setDescription('Monthly Maintenance');
    setTransactionId('');
    setPaymentStep('enter_amount');
    setErrors({});
  };

  const renderAmountEntry = () => (
    <Card style={styles.formCard}>
      <View style={styles.formContent}>
        <Title style={styles.cardTitle}>Enter Payment Details</Title>
        
        <TextInput
          label="Amount (₹)"
          value={amount}
          onChangeText={setAmount}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          error={!!errors.amount}
          left={<TextInput.Icon icon="currency-inr" />}
        />
        <HelperText type="error" visible={!!errors.amount} style={styles.errorText}>
          {errors.amount}
        </HelperText>

        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          error={!!errors.description}
          placeholder="Monthly Maintenance, Security Fee, etc."
        />
        <HelperText type="error" visible={!!errors.description} style={styles.errorText}>
          {errors.description}
        </HelperText>

        <View style={styles.paymentInfo}>
          <Text style={styles.payeeLabel}>Payment to:</Text>
          <Text style={styles.payeeName}>{APP_CONFIG.upi.payeeName}</Text>
          <Text style={styles.upiId}>UPI ID: {APP_CONFIG.upi.id}</Text>
        </View>

        <Button
          mode="contained"
          onPress={handleProceedToPayment}
          style={[
            styles.proceedButton, 
            (!amount || !description || Object.keys(errors).length > 0) && styles.disabledButton
          ]}
          labelStyle={styles.proceedButtonText}
          disabled={!amount || !description || Object.keys(errors).length > 0}
        >
          Proceed to Payment
        </Button>
      </View>
    </Card>
  );

  const renderPaymentOptions = () => (
    <Card style={styles.formCard}>
      <View style={styles.formContent}>
        <Title style={styles.cardTitle}>Payment Summary</Title>
        
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(parseFloat(amount))}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Description:</Text>
            <View style={styles.descriptionContainer}>
              <TouchableOpacity 
                style={styles.descriptionTouchable}
                onPress={() => setShowDescriptionModal(true)}
              >
                <Text style={styles.summaryValue} numberOfLines={1} ellipsizeMode="tail">
                  {description}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transaction ID:</Text>
            <View style={styles.transactionContainer}>
              <Text style={styles.summaryValue} numberOfLines={1} ellipsizeMode="tail">
                {transactionId}
              </Text>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        <Text style={styles.optionsTitle}>Choose Payment Method</Text>
        
        <View style={styles.upiAppsContainer}>
          {upiApps.map((app, index) => (
            <TouchableOpacity
              key={index}
              style={styles.upiAppButton}
              onPress={() => handleUPIPayment(app)}
            >
              <Text style={styles.upiAppIcon}>{app.icon}</Text>
              <Text style={styles.upiAppName}>{app.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          mode="outlined"
          onPress={() => setPaymentStep('enter_amount')}
          style={styles.backButton}
          labelStyle={styles.backButtonText}
        >
          Back to Edit Amount
        </Button>
      </View>
    </Card>
  );

  const renderPaymentSuccess = () => (
    <Card style={styles.formCard}>
      <View style={styles.formContent}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Title style={styles.successTitle}>Payment Successful!</Title>
          
          <View style={styles.successDetails}>
            <Text style={styles.successLabel}>Amount Paid:</Text>
            <Text style={styles.successValue}>{formatCurrency(parseFloat(amount))}</Text>
            
            <Text style={styles.successLabel}>Transaction ID:</Text>
            <Text style={styles.successValue}>{transactionId}</Text>
            
            <Text style={styles.successLabel}>Payment Date:</Text>
            <Text style={styles.successValue}>{new Date().toLocaleDateString('en-IN')}</Text>
          </View>

          <Text style={styles.successMessage}>
            Your payment has been recorded with pending status. It will be verified through SMS or admin approval and updated accordingly.
          </Text>

          <View style={styles.noteContainer}>
            <Text style={styles.noteTitle}>📱 Note:</Text>
            <Text style={styles.noteText}>
              • Your payment is currently pending verification{'\n'}
              • Admin will review and approve your payment{'\n'}
              • You can check status in Payment Receipts
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={() => navigation.navigate('PaymentReceipts')}
            style={styles.doneButton}
            labelStyle={styles.doneButtonText}
          >
            View Payment Receipts
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.newPaymentButton}
            labelStyle={styles.newPaymentButtonText}
          >
            Back to Home
          </Button>

          <Button
            mode="outlined"
            onPress={resetPayment}
            style={styles.newPaymentButton}
            labelStyle={styles.newPaymentButtonText}
          >
            Make Another Payment
          </Button>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Processing payment...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Title style={styles.title}>Pay Maintenance</Title>
          <Text style={styles.subtitle}>
            Secure UPI payment for your apartment
          </Text>
        </View>

        {paymentStep === 'enter_amount' && renderAmountEntry()}
        {paymentStep === 'payment_options' && renderPaymentOptions()}
        {paymentStep === 'payment_success' && renderPaymentSuccess()}
      </ScrollView>

      {/* Description Modal */}
      <Modal
        visible={showDescriptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDescriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Title style={styles.modalTitle}>Payment Description</Title>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowDescriptionModal(false)}
                style={styles.closeButton}
              />
            </View>
            <Divider />
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>{description}</Text>
            </ScrollView>
          </View>
        </View>
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
  cardTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.lg,
    textAlign: 'center',
  },
  input: {
    marginBottom: Layout.spacing.xs,
    backgroundColor: Colors.surface,
  },
  paymentInfo: {
    backgroundColor: Colors.lightGray,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginVertical: Layout.spacing.lg,
  },
  payeeLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.xs,
  },
  payeeName: {
    fontSize: Layout.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  upiId: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  proceedButton: {
    backgroundColor: Colors.primary,
    marginTop: Layout.spacing.lg,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  proceedButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
  summaryContainer: {
    backgroundColor: Colors.lightGray,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
    minHeight: 40,
  },
  summaryLabel: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    width: 120,
    flexShrink: 0,
  },
  summaryValue: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  divider: {
    marginVertical: Layout.spacing.lg,
  },
  optionsTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.lg,
    textAlign: 'center',
  },
  upiAppsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.lg,
  },
  upiAppButton: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  upiAppIcon: {
    fontSize: 24,
    marginBottom: Layout.spacing.sm,
  },
  upiAppName: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  backButton: {
    borderColor: Colors.gray,
    marginTop: Layout.spacing.md,
  },
  backButtonText: {
    color: Colors.gray,
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: Layout.spacing.lg,
  },
  successTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.success,
    marginBottom: Layout.spacing.lg,
    textAlign: 'center',
  },
  successDetails: {
    width: '100%',
    backgroundColor: Colors.lightGray,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.lg,
  },
  successLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.sm,
  },
  successValue: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  successMessage: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.xl,
  },
  doneButton: {
    backgroundColor: Colors.success,
    width: '100%',
    marginBottom: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  doneButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
  newPaymentButton: {
    borderColor: Colors.primary,
    width: '100%',
  },
  newPaymentButtonText: {
    color: Colors.primary,
  },
  descriptionContainer: {
    flex: 1,
    marginLeft: Layout.spacing.sm,
  },
  descriptionTouchable: {
    flex: 1,
  },
  transactionContainer: {
    flex: 1,
    marginLeft: Layout.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    width: '100%',
    maxHeight: '80%',
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  modalTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  modalBody: {
    padding: Layout.spacing.lg,
    maxHeight: 300,
  },
  modalText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text,
    lineHeight: 24,
  },
  errorText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    backgroundColor: '#ffebee',
    padding: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Layout.spacing.xs,
  },
  disabledButton: {
    backgroundColor: Colors.lightGray,
    opacity: 0.6,
  },
  noteContainer: {
    backgroundColor: Colors.lightBlue + '20',
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginVertical: Layout.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  noteTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Layout.spacing.sm,
  },
  noteText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
});

export default PaymentScreen;
