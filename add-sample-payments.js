// Temporary file to add sample payment data for testing
import DatabaseService from '../src/services/database.js';

const addSamplePayments = async () => {
  try {
    console.log('🧪 Adding sample payment data...');
    
    const samplePayments = [
      {
        userId: 'vJrs4maS2y4LZjxJTkPt', // Your admin user ID
        username: 'Manths',
        buildingId: 'F',
        houseNumber: '101',
        amount: 2500,
        description: 'Monthly Maintenance - July 2025',
        transactionId: 'TXN202507001',
        paymentMethod: 'UPI',
        upiId: 'sagarmanthan0001-1@oksbi',
        status: 'success',
        expectedAmount: 2500,
        expectedUPIId: 'sagarmanthan0001-1@oksbi',
        smsDetails: {
          amount: 2500,
          upiId: 'sagarmanthan0001-1@oksbi',
          transactionId: '559526315119',
          date: '17-08-25',
          bankDetails: 'Kotak Bank AC',
          isPaymentConfirmation: true
        },
        smsVerified: true
      },
      {
        userId: 'member123',
        username: 'John Doe',
        buildingId: 'F',
        houseNumber: '102',
        amount: 2500,
        description: 'Monthly Maintenance - July 2025',
        transactionId: 'TXN202507002',
        paymentMethod: 'UPI',
        upiId: 'sagarmanthan0001-1@oksbi',
        status: 'pending',
        expectedAmount: 2500,
        expectedUPIId: 'sagarmanthan0001-1@oksbi'
      },
      {
        userId: 'member456',
        username: 'Jane Smith',
        buildingId: 'F',
        houseNumber: '201',
        amount: 2500,
        description: 'Monthly Maintenance - July 2025',
        transactionId: 'TXN202507003',
        paymentMethod: 'UPI',
        upiId: 'sagarmanthan0001-1@oksbi',
        status: 'failed',
        expectedAmount: 2500,
        expectedUPIId: 'sagarmanthan0001-1@oksbi'
      }
    ];

    for (const payment of samplePayments) {
      const result = await DatabaseService.savePaymentWithSMS(payment, payment.smsDetails || null);
      if (result.success) {
        console.log(`✅ Added payment: ${payment.username} - ₹${payment.amount} - ${payment.status}`);
      } else {
        console.log(`❌ Failed to add payment for ${payment.username}:`, result.error);
      }
    }

    console.log('🎉 Sample payment data added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample payments:', error);
  }
};

// Export for use in React Native
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { addSamplePayments };
}

// For testing in Node.js
if (typeof window === 'undefined') {
  addSamplePayments();
}
