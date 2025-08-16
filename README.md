# Karnavati Nagar Flat - Community App

A React Native hybrid mobile application for apartment community management, built with Expo and Firebase.

## Features

### 🏠 Building Selection
- Support for multiple apartment blocks
- Currently supports Block F with expansion capability

### 🔐 Authentication
- Simple username/mobile/password registration
- Local storage for user credentials
- Automatic login for returning users

### 🎫 Ticket Management
- Raise tickets with categories and priorities
- File attachments (images, documents)
- Track ticket status and history
- View all your submitted tickets

### 💳 Maintenance Payment
- UPI-based payment system
- Integration with popular UPI apps (GPay, PhonePe, Paytm, CRED)
- Payment history tracking
- Secure transaction recording

### 📅 Calendar (Coming Soon)
- Society events and notifications
- Maintenance schedules
- Meeting reminders

## Tech Stack

- **Framework**: React Native with Expo
- **UI Library**: React Native Paper
- **Navigation**: React Navigation v6
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Local Storage**: AsyncStorage
- **State Management**: React Hooks

## Project Structure

```
src/
├── components/          # Reusable UI components
├── constants/          # App configuration and constants
├── hooks/              # Custom React hooks
├── navigation/         # Navigation configuration
├── screens/            # App screens/pages
├── services/           # External service integrations
└── utils/              # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd KarnavatiApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Follow the detailed instructions in `FIREBASE_SETUP.md`
   - Configure your Firebase project
   - Update configuration in `src/services/firebase.js`

4. **Update Configuration**
   - Edit `src/constants/config.js`
   - Update UPI ID for payments
   - Modify building list as needed

5. **Start the development server**
   ```bash
   npx expo start
   ```

6. **Run on device**
   - Install Expo Go on your mobile device
   - Scan the QR code to run the app
   - Or use `npx expo start --android` / `npx expo start --ios`

## Configuration

### UPI Payment Setup
Update the UPI configuration in `src/constants/config.js`:

```javascript
upi: {
  id: 'your-upi-id@bank', // Replace with actual UPI ID
  payeeName: 'Your Society Name',
}
```

### Building Configuration
Add or modify buildings in `src/constants/config.js`:

```javascript
buildings: [
  {
    id: 'F',
    name: 'Block F',
    isActive: true,
    description: 'Available for registration',
  },
  // Add more buildings here
]
```

### File Upload Limits
Customize file upload limits in `src/constants/config.js`:

```javascript
fileUpload: {
  maxImageSize: 5 * 1024 * 1024, // 5MB
  maxVideoSize: 50 * 1024 * 1024, // 50MB
  maxDocumentSize: 10 * 1024 * 1024, // 10MB
}
```

## Key Features Implementation

### Local Storage Caching
- User data persists locally using AsyncStorage
- Offline ticket viewing with cached data
- Automatic sync when network is available

### File Attachments
- Support for images, videos, and documents
- File size validation
- Secure Firebase Storage integration

### UPI Payment Integration
- Deep linking to UPI apps
- Automatic transaction ID generation
- Payment history tracking

### Modular Architecture
- Clean separation of concerns
- Reusable components and utilities
- Easy to maintain and extend

## Development Guidelines

### Code Organization
- Place reusable components in `src/components/`
- Keep screen-specific logic in respective screen files
- Use custom hooks for complex state management
- Maintain consistent styling using theme constants

### Adding New Features
1. Create necessary constants in `src/constants/`
2. Add utility functions in `src/utils/`
3. Create components in `src/components/`
4. Implement screens in `src/screens/`
5. Update navigation if needed

### Testing
- Test on both Android and iOS devices
- Verify Firebase connectivity
- Test offline functionality
- Validate UPI payment flows

## Deployment

### Building for Production

1. **Configure app.json**
   ```json
   {
     "expo": {
       "name": "Karnavati Nagar App",
       "slug": "karnavati-nagar",
       "version": "1.0.0",
       "android": {
         "package": "com.karnavatiapp",
         "versionCode": 1
       },
       "ios": {
         "bundleIdentifier": "com.karnavatiapp",
         "buildNumber": "1.0.0"
       }
     }
   }
   ```

2. **Build the app**
   ```bash
   # For Android
   npx expo build:android
   
   # For iOS
   npx expo build:ios
   ```

3. **Publish to app stores**
   - Follow Google Play Store guidelines for Android
   - Follow App Store guidelines for iOS

## Troubleshooting

### Common Issues

1. **Firebase connection errors**
   - Verify Firebase configuration
   - Check internet connectivity
   - Ensure Firebase project is active

2. **UPI payment not working**
   - Check if UPI apps are installed
   - Verify UPI ID format
   - Test on actual device (not simulator)

3. **File upload failures**
   - Check file size limits
   - Verify Firebase Storage rules
   - Ensure internet connectivity

4. **Navigation issues**
   - Clear Metro cache: `npx expo start --clear`
   - Restart the development server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for internal use by Karnavati Nagar community.

## Support

For technical support or feature requests, please contact the development team.

---

**Note**: This app is designed specifically for Karnavati Nagar Flat community management. Customize the configuration files before deploying for other communities.
