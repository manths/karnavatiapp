import { Platform } from 'react-native';
import { SafeConsole } from '../utils/safeAccess';

class SMSService {
  constructor() {
    this.isSupported = Platform.OS === 'android';
  }

  // Note: SMS reading requires special permissions and is platform-specific
  // This is a placeholder structure for future implementation
  async checkSMSPermissions() {
    if (!this.isSupported) {
      return { success: false, error: 'SMS reading not supported on this platform' };
    }
    
    // TODO: Implement permission checking for Android
    // Requires: android.permission.READ_SMS
    return { success: false, error: 'SMS permissions not implemented' };
  }

  async readLatestSMS(timeWindow = 10 * 60 * 1000) { // 10 minutes
    try {
      if (!this.isSupported) {
        return { success: false, error: 'SMS reading not supported on this platform' };
      }

      // TODO: Implement SMS reading
      // This would typically involve:
      // 1. Reading SMS messages from the inbox
      // 2. Filtering by time window (last 10 minutes)
      // 3. Looking for payment confirmation messages
      // 4. Extracting transaction details

      return { 
        success: false, 
        error: 'SMS reading not implemented yet',
        placeholder: true 
      };
    } catch (error) {
      SafeConsole.error('Error reading SMS:', error);
      return { success: false, error: error.message };
    }
  }

  // Parse payment confirmation SMS
  parsePaymentSMS(smsText) {
    try {
      // Updated patterns based on the provided SMS format:
      // "Sent Rs.1.00 from Kotak Bank AC X6878 to sagarmanthan0001-1@oksbi on 17-08-25.UPI Ref 559526315119."
      const patterns = {
        amount: /(?:Sent|Rs\.?|₹)\s*Rs\.?([0-9,]+(?:\.[0-9]{2})?)/i,
        upiId: /to\s+([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/i,
        transactionId: /(?:UPI\s*Ref|Ref)\s*([A-Za-z0-9]{10,})/i,
        date: /on\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
        bankDetails: /from\s+([A-Za-z\s]+(?:Bank|AC))\s+[A-Z]*(\w+)/i,
      };

      const result = {
        amount: null,
        upiId: null,
        transactionId: null,
        date: null,
        bankDetails: null,
        isPaymentConfirmation: false,
        originalText: smsText,
      };

      // Check if this looks like a payment confirmation SMS
      const paymentKeywords = ['sent', 'paid', 'debited', 'transferred', 'upi', 'transaction'];
      const isPaymentSMS = paymentKeywords.some(keyword => 
        smsText.toLowerCase().includes(keyword)
      );

      if (!isPaymentSMS) {
        return { success: false, error: 'Not a payment confirmation SMS' };
      }

      // Extract details using regex patterns
      Object.keys(patterns).forEach(key => {
        const match = smsText.match(patterns[key]);
        if (match) {
          if (key === 'amount') {
            // Clean up amount (remove commas, convert to number)
            result[key] = parseFloat(match[1].replace(/,/g, ''));
          } else {
            result[key] = match[1];
          }
        }
      });

      result.isPaymentConfirmation = !!result.amount && !!result.upiId;

      return { success: true, data: result };
    } catch (error) {
      SafeConsole.error('Error parsing payment SMS:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate payment against expected details
  validatePaymentSMS(smsData, expectedAmount, expectedUPIId) {
    try {
      const validation = {
        isValid: false,
        errors: [],
        confidence: 0,
      };

      if (!smsData.isPaymentConfirmation) {
        validation.errors.push('Not a payment confirmation message');
        return validation;
      }

      // Check amount
      if (smsData.amount) {
        if (Math.abs(smsData.amount - expectedAmount) < 0.01) {
          validation.confidence += 40;
        } else {
          validation.errors.push(`Amount mismatch: Expected ₹${expectedAmount}, found ₹${smsData.amount}`);
        }
      } else {
        validation.errors.push('Amount not found in SMS');
      }

      // Check UPI ID
      if (smsData.upiId) {
        if (smsData.upiId.toLowerCase() === expectedUPIId.toLowerCase()) {
          validation.confidence += 40;
        } else {
          validation.errors.push(`UPI ID mismatch: Expected ${expectedUPIId}, found ${smsData.upiId}`);
        }
      } else {
        validation.errors.push('UPI ID not found in SMS');
      }

      // Basic confidence check
      if (smsData.transactionId) {
        validation.confidence += 10;
      }

      if (smsData.date || smsData.time) {
        validation.confidence += 10;
      }

      validation.isValid = validation.confidence >= 70 && validation.errors.length === 0;

      return validation;
    } catch (error) {
      SafeConsole.error('Error validating payment SMS:', error);
      return {
        isValid: false,
        errors: ['Validation error'],
        confidence: 0,
      };
    }
  }

  // For development/testing - simulate SMS verification
  simulatePaymentVerification(amount, upiId) {
    // This matches the actual SMS format from the provided image
    const mockSMSText = `Sent Rs.${amount} from Kotak Bank AC X6878 to ${upiId} on ${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.UPI Ref ${Date.now().toString().slice(-12)}. Not you, https://kotak.com/KBANKT/Fraud`;
    
    const parseResult = this.parsePaymentSMS(mockSMSText);
    if (parseResult.success) {
      const validation = this.validatePaymentSMS(parseResult.data, amount, upiId);
      return {
        success: true,
        smsData: parseResult.data,
        validation,
        simulated: true,
      };
    }

    return { success: false, error: 'Simulation failed' };
  }
}

export default new SMSService();
