// Simple SMS parsing test
const testSMSMessage = "Sent Rs.1.00 from Kotak Bank AC X6878 to sagarmanthan0001-1@oksbi on 17-08-25.UPI Ref 559526315119. Not you, https://kotak.com/KBANKT/Fraud";

// SMS parsing function
function parsePaymentSMS(smsText) {
  try {
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

    // Extract details using regex patterns
    Object.keys(patterns).forEach(key => {
      const match = smsText.match(patterns[key]);
      if (match) {
        if (key === 'amount') {
          result[key] = parseFloat(match[1].replace(/,/g, ''));
        } else {
          result[key] = match[1];
        }
      }
    });

    result.isPaymentConfirmation = !!result.amount && !!result.upiId;
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Validation function
function validatePaymentSMS(smsData, expectedAmount, expectedUPIId) {
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

  if (smsData.date) {
    validation.confidence += 10;
  }

  validation.isValid = validation.confidence >= 70 && validation.errors.length === 0;
  return validation;
}

// Run test
console.log('🧪 Testing SMS Parsing...');
console.log('Original SMS:', testSMSMessage);
console.log('---');

const result = parsePaymentSMS(testSMSMessage);

if (result.success) {
  console.log('✅ Parsing successful!');
  console.log('Extracted data:', result.data);
  
  // Test validation
  const validation = validatePaymentSMS(
    result.data, 
    1.00, // expected amount
    'sagarmanthan0001-1@oksbi' // expected UPI ID
  );
  
  console.log('---');
  console.log('Validation result:', validation);
  
  if (validation.isValid) {
    console.log('✅ SMS validation passed!');
  } else {
    console.log('❌ SMS validation failed:', validation.errors);
  }
} else {
  console.log('❌ Parsing failed:', result.error);
}
