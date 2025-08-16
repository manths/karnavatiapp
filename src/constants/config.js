export const APP_CONFIG = {
  name: 'Karnavati Nagar Flat',
  version: '1.0.0',
  
  // Building configuration
  buildings: [
    {
      id: 'F',
      name: 'Block F',
      isActive: true,
      description: 'Available for registration',
    },
    // Future buildings can be added here
    // {
    //   id: 'G',
    //   name: 'Block G',
    //   isActive: false,
    //   description: 'Coming soon',
    // },
  ],
  
  // UPI Configuration
  upi: {
    id: 'sagarmanthan0001-1@oksbi', // Your test UPI ID
    payeeName: 'Karnavati Nagar Society',
  },
  
  // File upload limits
  fileUpload: {
    maxImageSize: 5 * 1024 * 1024, // 5MB
    maxVideoSize: 50 * 1024 * 1024, // 50MB
    maxDocumentSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    allowedVideoTypes: ['video/mp4', 'video/mov', 'video/avi'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  
  // Ticket configuration
  ticket: {
    categories: [
      'Maintenance Issue',
      'Security Concern',
      'Plumbing',
      'Electrical',
      'Cleaning',
      'Parking',
      'Noise Complaint',
      'Other',
    ],
    priorities: [
      { value: 'low', label: 'Low', color: '#4CAF50' },
      { value: 'medium', label: 'Medium', color: '#FF9800' },
      { value: 'high', label: 'High', color: '#F44336' },
    ],
    statuses: [
      { value: 'open', label: 'Open', color: '#FF9800' },
      { value: 'in_progress', label: 'In Progress', color: '#2196F3' },
      { value: 'resolved', label: 'Resolved', color: '#4CAF50' },
      { value: 'closed', label: 'Closed', color: '#757575' },
    ],
  },
  
  // Database configuration
  database: {
    collections: {
      users: 'users',
      tickets: 'tickets',
      payments: 'payments',
      buildings: 'buildings',
    },
  },
};
