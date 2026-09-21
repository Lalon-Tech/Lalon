import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
import { doc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
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
  // Inactivity Auto-Logout helpers
  wasAutoLoggedOut: boolean;
  clearAutoLoggedOut: () => void;
  inactivityWarning: boolean;
  inactivitySecondsRemaining: number;
  stayLoggedIn: () => void;
}

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const INACTIVITY_WARNING_MS = 9 * 60 * 1000;  // 9 minutes (warning 60 seconds before logout)

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | AppAuthUser | null>(() => {
    try {
      const saved = sessionStorage.getItem('somiti_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return !sessionStorage.getItem('somiti_session_user');
  });
  const [error, setError] = useState<string | null>(null);

  // Auto-logout state
  const [wasAutoLoggedOut, setWasAutoLoggedOut] = useState<boolean>(() => {
    return sessionStorage.getItem('somiti_auto_logout_notice') === 'true';
  });
  const [inactivityWarning, setInactivityWarning] = useState<boolean>(false);
  const [inactivitySecondsRemaining, setInactivitySecondsRemaining] = useState<number>(60);
  const lastActivityRef = useRef<number>(Date.now());
  const lastThrottleRef = useRef<number>(Date.now());

  // One-time cleanup of legacy shared localStorage session to guarantee independent tabs
  useEffect(() => {
    try {
      localStorage.removeItem('somiti_local_user');
    } catch {}
  }, []);

  useEffect(() => {
    // Safety watchdog: In sandboxed iframes or slow networks,
    // ensure loading state NEVER hangs indefinitely! (Max 1.2s timeout)
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(safetyTimer);
      if (currentUser) {
        setUser(currentUser);
        sessionStorage.removeItem('somiti_session_user');
      } else {
        const saved = sessionStorage.getItem('somiti_session_user');
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
      clearTimeout(safetyTimer);
      console.error("Firebase auth state error:", err);
      const saved = sessionStorage.getItem('somiti_session_user');
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  // 10-Minute Inactivity Auto-Logout Tracker
  const resetActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    if (inactivityWarning) {
      setInactivityWarning(false);
    }
  }, [inactivityWarning]);

  const stayLoggedIn = useCallback(() => {
    resetActivity();
    setInactivityWarning(false);
  }, [resetActivity]);

  useEffect(() => {
    if (!user) {
      setInactivityWarning(false);
      return;
    }

    // Initialize activity timestamp when user is logged in
    lastActivityRef.current = Date.now();

    const handleUserInteraction = () => {
      const now = Date.now();
      // Throttle event listener updates to every 2 seconds for optimal UI responsiveness
      if (now - lastThrottleRef.current > 2000) {
        lastThrottleRef.current = now;
        lastActivityRef.current = now;
        if (inactivityWarning) {
          setInactivityWarning(false);
        }
      }
    };

    const events: (keyof WindowEventMap)[] = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    events.forEach(eventName => {
      window.addEventListener(eventName, handleUserInteraction, { passive: true });
    });

    // Check inactivity every second for accurate countdown and logout
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        // Automatically log out user after 10 minutes of inactivity
        console.warn("User auto-logged out due to 10 minutes of inactivity.");
        sessionStorage.setItem('somiti_auto_logout_notice', 'true');
        setWasAutoLoggedOut(true);
        setInactivityWarning(false);
        logOut();
      } else if (elapsed >= INACTIVITY_WARNING_MS) {
        // Warning 1 minute before auto logout
        setInactivityWarning(true);
        const remainingSecs = Math.max(1, Math.round((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
        setInactivitySecondsRemaining(remainingSecs);
      } else {
        if (inactivityWarning) {
          setInactivityWarning(false);
        }
      }
    }, 1000);

    return () => {
      events.forEach(eventName => {
        window.removeEventListener(eventName, handleUserInteraction);
      });
      clearInterval(interval);
    };
  }, [user, inactivityWarning]);

  const clearAutoLoggedOut = () => {
    sessionStorage.removeItem('somiti_auto_logout_notice');
    setWasAutoLoggedOut(false);
  };

  const clearError = () => setError(null);

  const signIn = async (identifier: string, pass: string) => {
    setError(null);
    let cleanEmail = identifier.trim();
    let resolvedUser: any = null;

    // Rule 6: Support login using Email Address OR User UID (e.g. BS-1001, BS-101)
    if (!cleanEmail.includes('@')) {
      const normalizedUid = cleanEmail.toUpperCase();

      // 1. Try querying Firestore systemUsers by userUid or document ID
      try {
        const q = query(collection(db, 'systemUsers'), where('userUid', '==', normalizedUid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          resolvedUser = snap.docs[0].data();
          cleanEmail = resolvedUser.email;
        }
      } catch (fsErr) {
        console.warn("Firestore userUid query failed:", fsErr);
      }

      // 2. Check localStorage 'bondhu_users' or initial users if not yet resolved
      if (!resolvedUser) {
        try {
          const saved = localStorage.getItem('bondhu_users');
          if (saved) {
            const parsed = JSON.parse(saved);
            const matched = parsed.find((u: any) => 
              (u.userUid && u.userUid.toUpperCase() === normalizedUid) ||
              (u.id && u.id.toUpperCase() === normalizedUid)
            );
            if (matched?.email) {
              resolvedUser = matched;
              cleanEmail = matched.email;
            }
          }
        } catch {}
      }

      // 3. Known admin fallback
      if (!resolvedUser && (normalizedUid === 'BS-1001' || normalizedUid === 'USR-ADMIN')) {
        resolvedUser = { email: 'admin@bondhusomiti.com', name: 'প্রধান প্রশাসক', userUid: 'BS-1001' };
        cleanEmail = 'admin@bondhusomiti.com';
      }

      if (!resolvedUser || !cleanEmail || !cleanEmail.includes('@')) {
        const msg = `"${identifier}" ইউজার ইউআইডি সম্বলিত কোনো অ্যাকাউন্ট পাওয়া যায়নি! সঠিক ইউআইডি অথবা ইমেইল দিয়ে চেষ্টা করুন।`;
        setError(msg);
        throw new Error(msg);
      }
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      sessionStorage.removeItem('somiti_session_user');
      setUser(cred.user);
    } catch (err: any) {
      console.warn("Firebase signIn info:", err?.code, err?.message);

      // If Firebase email/password provider is not enabled in Firebase Console (operation-not-allowed)
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
        const localUser: AppAuthUser = {
          uid: resolvedUser?.id || ('usr_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12)),
          email: cleanEmail,
          displayName: resolvedUser?.name || cleanEmail.split('@')[0],
          photoURL: resolvedUser?.avatarUrl || null,
        };
        sessionStorage.setItem('somiti_session_user', JSON.stringify(localUser));
        setUser(localUser);
        setError(null);
        return;
      }

      // If user account is not found, try auto sign-up with the provided credentials
      if (err.code === 'auth/user-not-found') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          sessionStorage.removeItem('somiti_session_user');
          setUser(cred.user);
          return;
        } catch (createErr: any) {
          console.warn("Auto-signup attempt on signIn:", createErr?.code);
        }
      }

      let msg = "ভুল ইমেইল/ইউআইডি অথবা পাসওয়ার্ড!";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = "এই ইমেইল/ইউআইডি তে কোনো অ্যাকাউন্ট পাওয়া যায়নি অথবা পাসওয়ার্ড ভুল।";
      } else if (err.code === 'auth/invalid-email') {
        msg = "সঠিক ইমেইল ঠিকানা অথবা ইউজার ইউআইডি (যেমন: BS-1001) দিন।";
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
    const lowerEmail = cleanEmail.toLowerCase();
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      sessionStorage.removeItem('somiti_session_user');
      if (name && cred.user) {
        await updateProfile(cred.user, { displayName: name });
        setUser({ ...cred.user, displayName: name } as User);
      } else if (cred.user) {
        setUser(cred.user);
      }

      // Sync to Firestore systemUsers collection with default role strictly 'member'
      try {
        const isAdmin = lowerEmail === 'sin4.riyas.lalon.dc@gmail.com' || lowerEmail === 'admin@bondhusomiti.com';
        await safeSetDoc(doc(db, 'systemUsers', cred.user.uid), {
          id: cred.user.uid,
          name: name || cleanEmail.split('@')[0],
          email: lowerEmail,
          role: isAdmin ? 'admin' : 'member',
          roleTitle: isAdmin ? 'প্রধান প্রশাসক (Super Admin)' : 'সদস্য (Member)',
          status: isAdmin ? 'active' : 'pending',
          createdAt: new Date().toISOString().split('T')[0]
        }, { merge: true });
      } catch (dbErr) {
        console.warn("Firestore systemUser create error:", dbErr);
      }
    } catch (err: any) {
      console.warn("Firebase signUp info:", err?.code, err?.message);

      // If email already exists in Firebase Auth:
      if (err.code === 'auth/email-already-in-use') {
        let hasActiveApprovedAccount = false;
        try {
          const q = query(collection(db, 'systemUsers'), where('email', '==', lowerEmail));
          const snap = await getDocs(q);
          hasActiveApprovedAccount = snap.docs.some(d => d.data().status === 'active');
        } catch (checkErr) {
          console.warn("Check active account error:", checkErr);
        }

        if (hasActiveApprovedAccount) {
          const msg = "এই ইমেইল দিয়ে ইতিমধ্যে একটি সক্রিয় একাউন্ট রয়েছে। অনুগ্রহ করে Sign In পেজ থেকে লগইন করুন।";
          setError(msg);
          throw new Error(msg);
        }

        // The user was previously rejected (and thus deleted from Firestore) or is re-registering
        try {
          const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
          sessionStorage.removeItem('somiti_session_user');
          if (name && cred.user) {
            await updateProfile(cred.user, { displayName: name }).catch(() => {});
            setUser({ ...cred.user, displayName: name } as User);
          } else if (cred.user) {
            setUser(cred.user);
          }

          // Create a new pending registration request in Firestore systemUsers with default 'member' role
          const isAdmin = lowerEmail === 'sin4.riyas.lalon.dc@gmail.com' || lowerEmail === 'admin@bondhusomiti.com';
          await safeSetDoc(doc(db, 'systemUsers', cred.user.uid), {
            id: cred.user.uid,
            name: name || cred.user.displayName || cleanEmail.split('@')[0],
            email: lowerEmail,
            role: isAdmin ? 'admin' : 'member',
            roleTitle: isAdmin ? 'প্রধান প্রশাসক (Super Admin)' : 'সদস্য (Member)',
            status: isAdmin ? 'active' : 'pending',
            createdAt: new Date().toISOString().split('T')[0],
          }, { merge: true });

          setError(null);
          return;
        } catch (signInErr: any) {
          console.warn("Re-signup with existing auth credentials fallback:", signInErr?.code);
          const regUid = 'reg_' + Date.now() + '_' + btoa(lowerEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
          const isAdmin = lowerEmail === 'sin4.riyas.lalon.dc@gmail.com' || lowerEmail === 'admin@bondhusomiti.com';
          
          await safeSetDoc(doc(db, 'systemUsers', regUid), {
            id: regUid,
            name: name || cleanEmail.split('@')[0],
            email: lowerEmail,
            role: isAdmin ? 'admin' : 'member',
            roleTitle: isAdmin ? 'প্রধান প্রশাসক (Super Admin)' : 'সদস্য (Member)',
            status: isAdmin ? 'active' : 'pending',
            createdAt: new Date().toISOString().split('T')[0],
          }, { merge: true });

          const localUser: AppAuthUser = {
            uid: regUid,
            email: lowerEmail,
            displayName: name || cleanEmail.split('@')[0],
            photoURL: null,
          };
          sessionStorage.setItem('somiti_session_user', JSON.stringify(localUser));
          setUser(localUser);
          setError(null);
          return;
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
        sessionStorage.setItem('somiti_session_user', JSON.stringify(localUser));
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
      sessionStorage.removeItem('somiti_session_user');
      setUser(cred.user);

      // Sync to Firestore systemUsers collection
      try {
        const userEmail = (cred.user.email || '').toLowerCase();
        const isAdmin = userEmail === 'sin4.riyas.lalon.dc@gmail.com' || userEmail === 'admin@bondhusomiti.com';
        const userDocRef = doc(db, 'systemUsers', cred.user.uid);
        const existingDoc = await getDoc(userDocRef);

        if (!existingDoc.exists()) {
          await safeSetDoc(userDocRef, {
            id: cred.user.uid,
            name: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
            email: cred.user.email,
            role: isAdmin ? 'admin' : 'member',
            status: isAdmin ? 'active' : 'pending',
            createdAt: new Date().toISOString().split('T')[0]
          });
        }
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
    const isMemberRole = role.toLowerCase().includes('member') || role.toLowerCase().includes('সদস্য');
    const localUser: AppAuthUser = {
      uid: isMemberRole ? 'member_demo_user' : 'admin_demo_user',
      email: isMemberRole ? 'member@bondhusomiti.com' : 'admin@bondhusomiti.com',
      displayName: isMemberRole ? 'মোঃ রফিকুল ইসলাম (সদস্য)' : `মোঃ আব্দুল্লাহ (${role})`,
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };
    sessionStorage.setItem('somiti_session_user', JSON.stringify(localUser));
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
    sessionStorage.removeItem('somiti_session_user');
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
      clearError,
      wasAutoLoggedOut,
      clearAutoLoggedOut,
      inactivityWarning,
      inactivitySecondsRemaining,
      stayLoggedIn
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
