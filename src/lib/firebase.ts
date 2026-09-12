import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  setDoc, 
  DocumentReference, 
  WriteBatch, 
  SetOptions,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Suppress transient offline/retry logging that causes false positive connection alerts
setLogLevel('error');

// Initialize Cloud Firestore with experimentalForceLongPolling for robust connectivity inside iframes and sandboxed environments
export const db = (() => {
  const databaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, databaseId);
  } catch {
    return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  }
})();

/**
 * Deeply removes all `undefined` values from an object or array to prevent
 * Firestore "Function setDoc() called with invalid data. Unsupported field value: undefined" errors.
 */
export function sanitizeFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeFirestoreData(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        clean[key] = sanitizeFirestoreData(value);
      }
    }
    return clean as T;
  }
  return data;
}

/**
 * Safe wrapper around Firestore setDoc that automatically strips undefined fields.
 */
export async function safeSetDoc<T extends Record<string, any>>(
  docRef: DocumentReference,
  data: T,
  options?: SetOptions
) {
  const sanitized = sanitizeFirestoreData(data);
  return options ? setDoc(docRef, sanitized, options) : setDoc(docRef, sanitized);
}

/**
 * Safe wrapper around Firestore batch.set that automatically strips undefined fields.
 */
export function safeBatchSet<T extends Record<string, any>>(
  batch: WriteBatch,
  docRef: DocumentReference,
  data: T,
  options?: SetOptions
) {
  const sanitized = sanitizeFirestoreData(data);
  if (options) {
    batch.set(docRef, sanitized, options);
  } else {
    batch.set(docRef, sanitized);
  }
}

/**
 * Creates a Firebase Authentication user account using a secondary Firebase app instance.
 * This allows an Admin to create accounts for members without signing out of their own session.
 */
export async function createAuthAccountWithoutSignout(email: string, pass: string, displayName?: string) {
  try {
    const existing = getApps().find(a => a.name === 'SecondaryAuthApp');
    const secondaryApp = existing || initializeApp(firebaseConfig, 'SecondaryAuthApp');
    const secondaryAuth = getAuth(secondaryApp);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    if (displayName && cred.user) {
      await updateProfile(cred.user, { displayName });
    }
    return cred.user;
  } catch (err: any) {
    console.warn("Secondary auth user creation warning:", err?.code, err?.message);
    return null;
  }
}
