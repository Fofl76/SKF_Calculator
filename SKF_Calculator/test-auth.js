// Simple test to check if Firebase Auth works
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAgp4krBEUH0aOHwx2y5VBZxrpNbIKkTzY",
  authDomain: "skfcalculator-7d6f8.firebaseapp.com",
  projectId: "skfcalculator-7d6f8",
  storageBucket: "skfcalculator-7d6f8.firebasestorage.app",
  messagingSenderId: "468948739418",
  appId: "1:468948739418:web:a7bbac0fc71f30be383f63",
  measurementId: "G-BY6CSWZLK2"
};

console.log('Testing Firebase Auth...');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

signInWithEmailAndPassword(auth, 'test@example.com', '123456')
  .then((userCredential) => {
    console.log('Login successful:', userCredential.user.email);
  })
  .catch((error) => {
    console.error('Login failed:', error.code, error.message);
  });