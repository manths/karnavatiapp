import { APP_CONFIG } from '../constants/config';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileType = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
    return 'image';
  } else if (['mp4', 'mov', 'avi', 'mkv', '3gp'].includes(extension)) {
    return 'video';
  } else if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) {
    return 'document';
  }
  
  return 'unknown';
};

export const isValidFileType = (fileName, type) => {
  const fileType = getFileType(fileName);
  
  if (type === 'image') {
    return APP_CONFIG.fileUpload.allowedImageTypes.some(allowedType => 
      fileName.toLowerCase().endsWith(allowedType.split('/')[1])
    );
  } else if (type === 'video') {
    return APP_CONFIG.fileUpload.allowedVideoTypes.some(allowedType => 
      fileName.toLowerCase().endsWith(allowedType.split('/')[1])
    );
  } else if (type === 'document') {
    return APP_CONFIG.fileUpload.allowedDocumentTypes.some(allowedType => {
      const ext = allowedType.split('/').pop();
      if (ext.includes('pdf')) return fileName.toLowerCase().endsWith('pdf');
      if (ext.includes('word')) return fileName.toLowerCase().endsWith('doc') || fileName.toLowerCase().endsWith('docx');
      return false;
    });
  }
  
  return false;
};

export const isValidFileSize = (fileSize, type) => {
  if (type === 'image') {
    return fileSize <= APP_CONFIG.fileUpload.maxImageSize;
  } else if (type === 'video') {
    return fileSize <= APP_CONFIG.fileUpload.maxVideoSize;
  } else if (type === 'document') {
    return fileSize <= APP_CONFIG.fileUpload.maxDocumentSize;
  }
  
  return false;
};

export const generateTicketId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return `TKT-${timestamp}-${randomStr}`.toUpperCase();
};

export const generateTransactionId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 8);
  return `TXN-${timestamp}-${randomStr}`.toUpperCase();
};

export const createUPIUrl = (upiId, amount, payeeName, transactionId) => {
  const baseUrl = 'upi://pay';
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toString(),
    cu: 'INR',
    tn: `Maintenance Payment - ${transactionId}`,
  });
  
  return `${baseUrl}?${params.toString()}`;
};

export const maskMobileNumber = (mobileNumber) => {
  if (!mobileNumber || mobileNumber.length < 4) return mobileNumber;
  const lastFour = mobileNumber.slice(-4);
  const masked = 'X'.repeat(mobileNumber.length - 4);
  return masked + lastFour;
};

// Date formatting function (re-exported from dateUtils for backward compatibility)
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};
