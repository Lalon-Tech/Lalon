import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile,
  setPersistence,
  browserSessionPersistence 
} from 'firebase/auth';
import { 
  getFirestore, 
  setDoc, 
  DocumentReference, 
  WriteBatch, 
  SetOptions,
  setLogLevel,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication with browserSessionPersistence for independent browser tab sessions
export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.warn("Could not set browserSessionPersistence:", err);
});

// Suppress internal connection/retry log noise to prevent false alarm alerts in dev environment
setLogLevel('silent');

// Initialize Cloud Firestore according to Firebase Integration Skill
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test Firestore backend connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore offline warning - operating in offline cache mode.");
    }
  }
}
testConnection();

/**
 * Deeply removes all `undefined` values and guards against Firestore limits:
 * - Prevents "Function setDoc() called with invalid data. Unsupported field value: undefined"
 * - Prevents "The value of property ... is longer than 1048487 bytes" by sanitizing oversized strings.
 */
export function sanitizeFirestoreData<T>(data: T, keyName?: string): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (typeof data === 'string') {
    // Firestore hard limit: property value cannot exceed 1,048,487 bytes
    if (data.length > 700000) {
      console.warn(`Firestore field "${keyName || 'unknown'}" exceeds safe limit (${data.length} chars). Sanitizing to prevent document rejection.`);
      if (keyName === 'logoUrl' || data.startsWith('data:image/')) {
        return '/logo.svg' as unknown as T;
      }
      return data.slice(0, 700000) as unknown as T;
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeFirestoreData(item, keyName)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        clean[key] = sanitizeFirestoreData(value, key);
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
