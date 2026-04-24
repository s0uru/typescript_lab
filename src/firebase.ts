import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAzoAnN06Zea3LMq9eTIKpfQBQ6KBDRrDQ",
  authDomain: "prismboard-b4bb5.firebaseapp.com",
  projectId: "prismboard-b4bb5",
  storageBucket: "prismboard-b4bb5.firebasestorage.app",
  messagingSenderId: "56566587644",
  appId: "1:56566587644:web:b5bb06d2c91144fec3b779"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();