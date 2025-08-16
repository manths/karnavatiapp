# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: "karnavati-nagar-app"
4. Accept the terms and click "Continue"
5. Choose whether to enable Google Analytics (optional)
6. Click "Create project"

## Step 2: Add Android App

1. In the Firebase console, click "Add app" and select Android
2. Register your app:
   - Package name: `com.karnavatiapp` (or your app.json expo.android.package)
   - App nickname: "Karnavati Nagar App"
   - Debug signing certificate: (leave empty for now)
3. Click "Register app"
4. Download `google-services.json`
5. Place the file in your project root (same level as app.json)

## Step 3: Add iOS App (for iOS support)

1. Click "Add app" and select iOS
2. Register your app:
   - Bundle ID: `com.karnavatiapp` (or your app.json expo.ios.bundleIdentifier)
   - App nickname: "Karnavati Nagar App"
3. Click "Register app"
4. Download `GoogleService-Info.plist`
5. Place the file in your project root

## Step 4: Enable Firestore Database

1. In Firebase console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to your users, e.g., asia-south1 for India)
5. Click "Done"

## Step 5: Enable Storage

1. Go to "Storage" in Firebase console
2. Click "Get started"
3. Choose "Start in test mode"
4. Select the same location as Firestore
5. Click "Done"

## Step 6: Update Firebase Configuration

Replace the configuration in `src/services/firebase.js` with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

You can find this config in:
- Firebase Console → Project Settings → General → Your apps → Config

## Step 7: Set Security Rules (Important!)

### Firestore Rules
Go to Firestore → Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tickets - users can create and read their own tickets
    match /tickets/{ticketId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Payments - users can create and read their own payments
    match /payments/{paymentId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

### Storage Rules
Go to Storage → Rules and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 8: Install Firebase CLI (Optional, for deployment)

```bash
npm install -g firebase-tools
firebase login
firebase init
```

## Step 9: Test Configuration

1. Run your app: `npx expo start`
2. Try creating a user account
3. Check if data appears in Firestore console
4. Try uploading an image in ticket creation
5. Check if files appear in Storage console

## Important Notes

1. **Free Tier Limits:**
   - Firestore: 1 GiB storage, 50K reads, 20K writes per day
   - Storage: 5 GB storage, 1 GB downloads per day
   - These limits should be sufficient for a community app

2. **Security:**
   - Never commit `google-services.json` or `GoogleService-Info.plist` to version control
   - Add them to `.gitignore`
   - For production, implement proper authentication

3. **UPI Configuration:**
   - Update `APP_CONFIG.upi.id` in `src/constants/config.js` with your actual UPI ID
   - Test UPI payments in a controlled environment first

4. **Production Ready Steps:**
   - Enable authentication (email/phone)
   - Set proper security rules
   - Add error reporting (Firebase Crashlytics)
   - Set up backup and monitoring

## Troubleshooting

- If you get "Default Firebase app not initialized", check your config
- If Firestore writes fail, check your security rules
- If storage uploads fail, ensure storage is enabled and rules are set
- For Android, make sure `google-services.json` is in the correct location
