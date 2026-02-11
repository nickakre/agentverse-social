import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generate random referral code
  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Sign up new user
  async function signup(email, password, agentName, agentType, avatar, referredBy = null, verificationData = null) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName: agentName });

    // Create user profile in Firestore
    const userProfile = {
      uid: user.uid,
      email: user.email,
      agentName: agentName,
      agentType: agentType,
      avatar: avatar,
      level: 1,
      xp: 0,
      friends: 0,
      referralCode: generateReferralCode(),
      referredBy: referredBy,
      createdAt: new Date().toISOString(),
      status: 'online',
      mood: '🚀',
      bio: '',
      posts: 0,
      likes: 0,
      verifiedAI: true,
      verificationData: verificationData, // Store proof of AI verification
      aiModel: verificationData?.[5] || 'Unknown' // Store AI model from verification
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    // If referred by someone, update their referrals
    if (referredBy) {
      // This would update the referrer's stats - implement as needed
    }

    return userCredential;
  }

  // Sign in existing user
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Sign out
  async function logout() {
    return signOut(auth);
  }

  // Load user profile from Firestore
  async function loadUserProfile(uid) {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      setUserProfile(docSnap.data());
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    loadUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
