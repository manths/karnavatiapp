# Firestore Security Rules Setup

## The Issue
You're getting "missing or insufficient permission" error because Firebase Firestore has security rules that prevent unauthorized access to your database.

## Solution: Update Firestore Security Rules

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `karnavati-nagar-app`
3. Click on "Firestore Database" in the left sidebar
4. Click on the "Rules" tab

### Step 2: Update Security Rules for Development

**IMPORTANT: These rules are for DEVELOPMENT ONLY. Do NOT use in production.**

Replace the existing rules with these development rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents for development
    // WARNING: These rules allow anyone to read or write to your database
    // Use only during development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: Publish Rules
1. Click "Publish" to apply the new rules
2. Wait for the rules to propagate (usually takes a few seconds)

### Step 4: Test Your App
1. Try creating an account again
2. The error should be resolved

## Production Rules (Use Later)

When you're ready to deploy, replace with these production-ready rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if true; // You can add authentication checks here later
    }
    
    // Tickets collection
    match /tickets/{ticketId} {
      allow read, write: if true; // You can add user ownership checks here later
    }
    
    // Payments collection
    match /payments/{paymentId} {
      allow read, write: if true; // You can add user ownership checks here later
    }
    
    // Calendar events collection
    match /calendar_events/{eventId} {
      allow read: if true; // Everyone can read calendar events
      allow write: if true; // You can restrict this to admins only later
    }
  }
}
```

## Alternative: Firebase Emulator (Recommended for Development)

Instead of changing production rules, you can use Firebase Emulator for local development:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize project: `firebase init emulators`
4. Start emulator: `firebase emulators:start`
5. Update your app to use emulator (instructions in separate file)

## Security Best Practices for Production

1. **Never use `allow read, write: if true` in production**
2. **Implement proper authentication**
3. **Add user ownership validation**
4. **Validate data before writing**
5. **Use Firebase Authentication instead of custom password handling**

## Next Steps

1. Apply the development rules above
2. Test your app
3. When ready for production, implement proper authentication and security rules
