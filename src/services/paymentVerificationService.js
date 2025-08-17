import { SafeConsole } from '../utils/safeAccess';
import SMSService from './smsService';
import DatabaseService from './database';
import { NotificationService } from './notificationService';

class PaymentVerificationService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 30000; // Check every 30 seconds
    this.intervalId = null;
  }

  // Start the automatic verification service
  start() {
    if (this.isRunning) {
      SafeConsole.log('Payment verification service already running');
      return;
    }

    SafeConsole.log('🔍 Starting payment verification service...');
    this.isRunning = true;
    
    // Run immediately and then at intervals
    this.checkPendingPayments();
    this.intervalId = setInterval(() => {
      this.checkPendingPayments();
    }, this.checkInterval);
  }

  // Stop the verification service
  stop() {
    if (!this.isRunning) {
      return;
    }

    SafeConsole.log('⏹️ Stopping payment verification service...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Check for pending payments that need verification
  async checkPendingPayments() {
    try {
      SafeConsole.log('🔍 Checking for pending payments...');
      
      // Get all pending payments (admin view)
      const result = await DatabaseService.getAllPayments();
      if (!result.success) {
        SafeConsole.error('Failed to fetch payments:', result.error);
        return;
      }

      const pendingPayments = result.data.filter(payment => 
        payment.status === 'pending' && 
        !payment.smsVerified &&
        payment.expectedAmount &&
        payment.expectedUPIId
      );

      SafeConsole.log(`Found ${pendingPayments.length} pending payments to verify`);

      for (const payment of pendingPayments) {
        await this.verifyPaymentViaSMS(payment);
      }
    } catch (error) {
      SafeConsole.error('Error checking pending payments:', error);
    }
  }

  // Verify a specific payment via SMS
  async verifyPaymentViaSMS(payment) {
    try {
      SafeConsole.log(`Verifying payment ${payment.id} for amount ₹${payment.expectedAmount}`);

      // For now, we'll simulate SMS verification since actual SMS reading requires native permissions
      const verificationResult = SMSService.simulatePaymentVerification(
        payment.expectedAmount,
        payment.expectedUPIId
      );

      if (verificationResult.success && verificationResult.validation.isValid) {
        // SMS verification successful
        await this.approvePayment(payment, verificationResult.smsData);
      } else {
        SafeConsole.log(`Payment ${payment.id} verification failed:`, verificationResult.validation?.errors);
      }
    } catch (error) {
      SafeConsole.error(`Error verifying payment ${payment.id}:`, error);
    }
  }

  // Approve payment after SMS verification
  async approvePayment(payment, smsData) {
    try {
      // Update payment status to success and add SMS details
      const updateResult = await DatabaseService.updatePaymentStatus(payment.id, 'success');
      
      if (updateResult.success) {
        SafeConsole.log(`✅ Payment ${payment.id} approved via SMS verification`);

        // Send notification to user
        await this.notifyPaymentApproved(payment);

        // Send notification to admins
        await this.notifyAdminPaymentReceived(payment, smsData);
      } else {
        SafeConsole.error('Failed to update payment status:', updateResult.error);
      }
    } catch (error) {
      SafeConsole.error('Error approving payment:', error);
    }
  }

  // Notify user that their payment was approved
  async notifyPaymentApproved(payment) {
    try {
      const notification = {
        title: '💰 Payment Approved!',
        body: `Your payment of ₹${payment.expectedAmount} has been verified and approved.`,
        data: {
          type: 'payment_approved',
          paymentId: payment.id,
          amount: payment.expectedAmount,
        },
      };

      await NotificationService.sendLocalNotification(
        notification.title,
        notification.body,
        notification.data
      );
    } catch (error) {
      SafeConsole.error('Error sending approval notification:', error);
    }
  }

  // Notify admins about received payment
  async notifyAdminPaymentReceived(payment, smsData) {
    try {
      const notification = {
        title: '💳 Payment Received',
        body: `${payment.username} paid ₹${payment.expectedAmount} for ${payment.description}`,
        data: {
          type: 'payment_received',
          paymentId: payment.id,
          userId: payment.userId,
          amount: payment.expectedAmount,
          username: payment.username,
          buildingId: payment.buildingId,
          houseNumber: payment.houseNumber,
        },
      };

      // Get admin users
      const adminResult = await DatabaseService.getAdminUsers();
      if (adminResult.success && adminResult.data.length > 0) {
        SafeConsole.log(`Notifying ${adminResult.data.length} admins about payment received`);
        
        // Send notification to all admins
        await NotificationService.sendLocalNotification(
          notification.title,
          notification.body,
          notification.data
        );
      }
    } catch (error) {
      SafeConsole.error('Error sending admin notification:', error);
    }
  }

  // Manual verification trigger (for testing)
  async manualVerification(paymentId) {
    try {
      const result = await DatabaseService.getAllPayments();
      if (!result.success) {
        return { success: false, error: 'Failed to fetch payment' };
      }

      const payment = result.data.find(p => p.id === paymentId);
      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      if (payment.status !== 'pending') {
        return { success: false, error: 'Payment is not in pending status' };
      }

      await this.verifyPaymentViaSMS(payment);
      return { success: true, message: 'Manual verification triggered' };
    } catch (error) {
      SafeConsole.error('Error in manual verification:', error);
      return { success: false, error: error.message };
    }
  }

  // Get verification service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      intervalId: this.intervalId,
    };
  }
}

export default new PaymentVerificationService();
