// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAgp4krBEUH0aOHwx2y5VBZxrpNbIKkTzY",
  authDomain: "skfcalculator-7d6f8.firebaseapp.com",
  projectId: "skfcalculator-7d6f8",
  storageBucket: "skfcalculator-7d6f8.firebasestorage.app",
  messagingSenderId: "468948739418",
  appId: "1:468948739418:web:a7bbac0fc71f30be383f63",
  measurementId: "G-BY6CSWZLK2"
};

// Initialize Firebase
let app;
let auth;
let db;

// Check if running in Expo/React Native environment
const isExpo = typeof global !== 'undefined' && global.__expo;

try {
  // Check if Firebase app already exists
  if (!app) {
    // For Expo/React Native, we need to ensure proper initialization
    if (isExpo) {
      console.log('Initializing Firebase for Expo/React Native');
    }
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully');
  } else {
    console.log('Firebase app already initialized, reusing existing instance');
  }

  // Initialize Firebase services
  if (!auth) {
    auth = getAuth(app);
    console.log('Firebase auth initialized');
  }

  if (!db) {
    db = getFirestore(app);
    console.log('Firebase firestore initialized');
  }

  console.log('All Firebase services initialized successfully');
  console.log('App:', !!app, 'Auth:', !!auth, 'DB:', !!db);
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.error('Error details:', (error as Error).message);
  console.error('Error code:', (error as any).code);

  // Check if it's a duplicate app error
  if (error.code === 'app/duplicate-app') {
    console.warn('Firebase app already exists, trying to get existing app');
    try {
      // Try to get existing app
      app = initializeApp(firebaseConfig, 'skf-calculator-app');
      auth = getAuth(app);
      db = getFirestore(app);
      console.log('Successfully reused existing Firebase app');
    } catch (secondError) {
      console.error('Failed to reuse existing Firebase app:', secondError as Error);
      // Fallback для случаев когда Firebase не настроен
      app = undefined;
      auth = undefined;
      db = undefined;
    }
  } else {
    // Fallback для случаев когда Firebase не настроен
    app = undefined;
    auth = undefined;
    db = undefined;
  }

  if (!app || !auth || !db) {
    console.warn('Firebase services set to undefined due to initialization error');
  }
}

export { auth as Auth };
export { db as Firestore };

// Only initialize analytics on web platform
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;