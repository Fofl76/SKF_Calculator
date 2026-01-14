import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import '../config/firebase';

console.log('Testing Firebase connection...');

const auth = getAuth();
console.log('Auth object:', !!auth);

if (auth) {
  console.log('Firebase is initialized correctly');
} else {
  console.log('Firebase is not initialized');
}