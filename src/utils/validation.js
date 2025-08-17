export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateMobileNumber = (number) => {
  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(number)) {
    return { isValid: false, message: 'Mobile number must be 10 digits and start with 6-9' };
  }
  return { isValid: true, message: '' };
};

export const validatePassword = (password) => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  return { isValid: true, message: '' };
};

export const validateUsername = (username) => {
  if (username.length < 3) {
    return { isValid: false, message: 'Username must be at least 3 characters long' };
  }
  if (username.length > 12) {
    return { isValid: false, message: 'Username must not exceed 12 characters' };
  }
  if (!/^[a-zA-Z0-9\s_]+$/.test(username)) {
    return { isValid: false, message: 'Username can only contain letters, numbers, spaces, and underscores' };
  }
  return { isValid: true, message: '' };
};

export const validateAmount = (amount) => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return { isValid: false, message: 'Please enter a valid amount' };
  }
  if (numAmount > 100000) {
    return { isValid: false, message: 'Amount cannot exceed ₹1,00,000' };
  }
  return { isValid: true, message: '' };
};

export const validateTicketDescription = (description) => {
  if (description.trim().length < 10) {
    return { isValid: false, message: 'Description must be at least 10 characters long' };
  }
  if (description.length > 1000) {
    return { isValid: false, message: 'Description must be less than 1000 characters' };
  }
  return { isValid: true, message: '' };
};
