import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { auth, db, safeSetDoc } from '../lib/firebase';

export interface AppAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

interface AuthContextType {
  user: User | AppAuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: (role?: string) => void;
  resetPassword: (email: string) => Promise<void>;
  logOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | AppAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.removeItem('somiti_local_user');
      } else {
        const saved = localStorage.getItem('somiti_local_user');
        if (saved) {
          try {
            setUser(JSON.parse(saved));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    }, (err) => {
      console.error("Firebase auth state error:", err);
      const saved = localStorage.getItem('somiti_local_user');
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const signIn = async (email: string, pass: string) => {
    setError(null);
    const cleanEmail = email.trim();
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      localStorage.removeItem('somiti_local_user');
      setUser(cred.user);
    } catch (err: any) {
      console.warn("Firebase signIn info:", err?.code, err?.message);

      // If Firebase email/password provider is not enabled in Firebase Console (operation-not-allowed)
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
        const localUser: AppAuthUser = {
          uid: 'usr_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12),
          email: cleanEmail,
          displayName: cleanEmail.split('@')[0],
          photoURL: null,
        };
        localStorage.setItem('somiti_local_user', JSON.stringify(localUser));
        setUser(localUser);
        setError(null);
        return;
      }

      // If user account is not found, try auto sign-up with the provided credentials
      if (err.code === 'auth/user-not-found') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          localStorage.removeItem('somiti_local_user');
          setUser(cred.user);
          return;
        } catch (createErr: any) {
          console.warn("Auto-signup attempt on signIn:", createErr?.code);
        }
      }

      let msg = "ভুল ইমেইল অথবা পাসওয়ার্ড!";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = "এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি অথবা পাসওয়ার্ড ভুল। আপনি নতুন হলে নিচে 'Sign up' বাটনে ক্লিক করে একাউন্ট নিবন্ধন করুন।";
      } else if (err.code === 'auth/invalid-email') {
        msg = "সঠিক ইমেইল ঠিকানা দিন (যেমন: name@example.com)।";
      } else if (err.code === 'auth/too-many-requests') {
        msg = "অতিরিক্ত ভুল চেষ্টার কারণে সাময়িক ব্লক করা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।";
      } else if (err.code === 'auth/network-request-failed') {
        msg = "ইন্টারনেট সংযোগ সমস্যা! আপনার কানেকশন চেক করুন।";
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const signUp = async (email: string, pass: string, name?: string) => {
    setError(null);
    const cleanEmail = email.trim();
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      localStorage.removeItem('somiti_local_user');
      if (name && cred.user) {
        await updateProfile(cred.user, { displayName: name });
        setUser({ ...cred.user, displayName: name } as User);
      } else if (cred.user) {
        setUser(cred.user);
      }

      // Sync to Firestore systemUsers collection
      try {
        await safeSetDoc(doc(db, 'systemUsers', cred.user.uid), {
          id: cred.user.uid,
          name: name || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: cleanEmail === 'sin4.riyas.lalon.dc@gmail.com' ? 'admin' : 'member',
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0]
        }, { merge: true });
      } catch (dbErr) {
        console.warn("Firestore systemUser create error:", dbErr);
      }
    } catch (err: any) {
      console.warn("Firebase signUp info:", err?.code, err?.message);

      // 1. If email already exists, try logging in with the provided password
      if (err.code === 'auth/email-already-in-use') {
        try {
          const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
          localStorage.removeItem('somiti_local_user');
          setUser(cred.user);
          setError(null);
          return;
        } catch (signInErr: any) {
          console.warn("Existing account sign in attempt failed:", signInErr?.code);
          const msg = "এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট খোলা রয়েছে। দয়া করে সঠিক পাসওয়ার্ড দিন অথবা Sign in পেজ থেকে লগইন করুন।";
          setError(msg);
          throw new Error(msg);
        }
      }

      // 2. If email/password provider is not yet enabled in Firebase Console (operation-not-allowed)
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
        const localUser: AppAuthUser = {
          uid: 'usr_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12),
          email: cleanEmail,
          displayName: name || cleanEmail.split('@')[0],
          photoURL: null,
        };
        localStorage.setItem('somiti_local_user', JSON.stringify(localUser));
        setUser(localUser);
        setError(null);
        return;
      }

      let msg = "একাউন্ট তৈরি করা যায়নি: " + (err?.message || err?.code || '');
      if (err.code === 'auth/weak-password') {
        msg = "পাসওয়ার্ড অত্যন্ত দুর্বল। অন্তত ৬ অক্ষরের পাসওয়ার্ড দিন।";
      } else if (err.code === 'auth/invalid-email') {
        msg = "সঠিক ইমেইল ঠিকানা দিন।";
      } else if (err.code === 'auth/network-request-failed') {
        msg = "নেটওয়ার্ক কানেকশন এরর। আপনার ইন্টারনেট সংযোগ চেক করুন।";
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      localStorage.removeItem('somiti_local_user');
      setUser(cred.user);

      // Sync to Firestore systemUsers collection
      try {
        await safeSetDoc(doc(db, 'systemUsers', cred.user.uid), {
          id: cred.user.uid,
          name: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
          email: cred.user.email,
          role: cred.user.email === 'sin4.riyas.lalon.dc@gmail.com' ? 'admin' : 'member',
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0]
        }, { merge: true });
      } catch (dbErr) {
        console.warn("Firestore systemUser create error:", dbErr);
      }
    } catch (err: any) {
      console.error("Firebase Google sign in error:", err);
      let msg = "Google সাইন-ইন সম্পন্ন করা যায়নি।";
      if (err.code === 'auth/popup-closed-by-user') {
        msg = "লগইন পপআপ উইন্ডোটি বন্ধ করে দেওয়া হয়েছে।";
      } else if (err.code === 'auth/popup-blocked') {
        msg = "ব্রাউজারে পপআপ ব্লক করা আছে। দয়া করে পপআপ অনুমোদন করুন।";
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        msg = "এই ইমেইল দিয়ে ভিন্ন পদ্ধতিতে পূর্বেই একাউন্ট তৈরি করা আছে।";
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const signInAsDemo = (role: string = 'Super Admin') => {
    setError(null);
    const localUser: AppAuthUser = {
      uid: 'admin_demo_user',
      email: 'admin@bondhusomiti.com',
      displayName: `মোঃ আব্দুল্লাহ (${role})`,
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };
    localStorage.setItem('somiti_local_user', JSON.stringify(localUser));
    setUser(localUser);
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      let msg = "পাসওয়ার্ড রিসেট ইমেইল পাঠানো যায়নি।";
      if (err.code === 'auth/user-not-found') {
        msg = "এই ইমেইলের কোনো একাউন্ট পাওয়া যায়নি।";
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const logOut = async () => {
    setError(null);
    localStorage.removeItem('somiti_local_user');
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error("Firebase sign out error:", err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      signIn, 
      signUp, 
      signInWithGoogle,
      signInAsDemo,
      resetPassword, 
      logOut, 
      clearError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
