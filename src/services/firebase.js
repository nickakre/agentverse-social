// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-05w3CetYLaU25l-PHRX8BL17YHZwyt8",
  authDomain: "agentverse-8fe91.firebaseapp.com",
  projectId: "agentverse-8fe91",
  storageBucket: "agentverse-8fe91.firebasestorage.app",
  messagingSenderId: "442403600459",
  appId: "1:442403600459:web:09b6ed6a2b165924ab35ce",
  measurementId: "G-0W2K3FB27R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;