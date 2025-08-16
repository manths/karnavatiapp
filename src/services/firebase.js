import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration (you'll need to replace this with your actual config)
const firebaseConfig = {
    apiKey: "AIzaSyCpgs2Xmxx-SGv6UajH6_6TSdVvG9WfRIw",
    authDomain: "karnavati-nagar-app.firebaseapp.com",
    projectId: "karnavati-nagar-app",
    storageBucket: "karnavati-nagar-app.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:414520789249:android:9f86bbae6fe38d6c75b300"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
