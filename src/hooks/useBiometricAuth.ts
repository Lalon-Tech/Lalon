import { useState, useEffect, useCallback } from 'react';
import { AppAuthUser } from '../context/AuthContext';

export interface BiometricCredential {
  id: string; // base64url encoded credential ID
  rawId: string;
  user: AppAuthUser;
  createdAt: string;
  deviceName: string;
  authenticatorAttachment?: string;
}

const STORAGE_KEY = 'somiti_biometric_credentials_v1';

// Convert ArrayBuffer to URL-safe Base64 string
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Convert URL-safe Base64 string to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  let str = base64.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  const binary = window.atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper to detect human-readable device name
function detectPlatformDeviceName(): string {
  const userAgent = navigator.userAgent || '';
  if (/Macintosh|Mac OS X/i.test(userAgent)) {
    return 'Apple Touch ID / Face ID';
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return 'iOS Face ID / Touch ID';
  } else if (/Windows/i.test(userAgent)) {
    return 'Windows Hello (Fingerprint / PIN / Face)';
  } else if (/Android/i.test(userAgent)) {
    return 'Android Biometric (Fingerprint / Face)';
  } else if (/Linux/i.test(userAgent)) {
    return 'Linux Biometric Authenticator';
  }
  return 'Device Platform Authenticator';
}

export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isPlatformAuthenticatorAvailable, setIsPlatformAuthenticatorAvailable] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [enrolledCredentials, setEnrolledCredentials] = useState<BiometricCredential[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load stored credentials from local storage
  const loadStoredCredentials = useCallback((): BiometricCredential[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load stored biometric credentials:', e);
    }
    return [];
  }, []);

  // Sync state on mount and check WebAuthn capabilities
  useEffect(() => {
    let isMounted = true;

    async function checkAvailability() {
      setIsChecking(true);
      // 1. Check if Web Authentication API is supported in window & navigator
      const supported = typeof window !== 'undefined' &&
        Boolean(window.PublicKeyCredential) &&
        Boolean(navigator.credentials) &&
        typeof navigator.credentials.create === 'function' &&
        typeof navigator.credentials.get === 'function';

      if (!isMounted) return;
      setIsSupported(supported);

      // Load already saved biometric credentials for this browser
      const creds = loadStoredCredentials();
      if (isMounted) {
        setEnrolledCredentials(creds);
      }

      // 2. Check if the device has a platform authenticator (TouchID, FaceID, Windows Hello, Android Biometrics)
      if (supported && window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        try {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          if (isMounted) {
            setIsPlatformAuthenticatorAvailable(available);
          }
        } catch (e) {
          console.warn('Error checking platform authenticator availability:', e);
          if (isMounted) {
            setIsPlatformAuthenticatorAvailable(false);
          }
        }
      } else {
        if (isMounted) {
          setIsPlatformAuthenticatorAvailable(false);
        }
      }

      if (isMounted) {
        setIsChecking(false);
      }
    }

    checkAvailability();

    return () => {
      isMounted = false;
    };
  }, [loadStoredCredentials]);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccess(null), []);

  /**
   * Register device biometrics (fingerprint / face scan) for the currently authenticated user
   */
  const registerBiometrics = useCallback(
    async (
      user: AppAuthUser,
      deviceLabel?: string
    ): Promise<{ success: boolean; credential?: BiometricCredential; error?: string }> => {
      clearError();
      clearSuccess();
      setLoading(true);

      if (!isSupported) {
        const msg = 'আপনার ব্রাউজার বা ডিভাইসে Web Authentication (বায়োমেট্রিক) সমর্থিত নয়।';
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      }

      try {
        const challenge = window.crypto.getRandomValues(new Uint8Array(32));
        const userUid = user.uid || 'usr_' + Date.now();
        const userIdBuffer = new TextEncoder().encode(userUid);
        const userEmail = user.email || `${userUid}@somiti.local`;
        const displayName = user.displayName || userEmail.split('@')[0];

        // Relying Party configuration
        const rpId = window.location.hostname;

        const publicKeyCredentialCreationOptions: CredentialCreationOptions = {
          publicKey: {
            challenge,
            rp: {
              name: 'বন্ধু সমবায় সমিতি লিমিটেড',
              id: rpId || undefined,
            },
            user: {
              id: userIdBuffer,
              name: userEmail,
              displayName: displayName,
            },
            pubKeyCredParams: [
              { alg: -7, type: 'public-key' },   // ES256 (P-256 with SHA-256)
              { alg: -257, type: 'public-key' }, // RS256
              { alg: -8, type: 'public-key' },   // Ed25519
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform', // Built-in device scanner (fingerprint / FaceID)
              userVerification: 'required',        // Requires actual biometric scan or device PIN
              residentKey: 'preferred',
            },
            timeout: 60000,
            attestation: 'none',
          },
        };

        const credential = (await navigator.credentials.create(
          publicKeyCredentialCreationOptions
        )) as PublicKeyCredential | null;

        if (!credential) {
          throw new Error('বায়োমেট্রিক তথ্য তৈরি করা সম্ভব হয়নি।');
        }

        const credId = bufferToBase64(credential.rawId);
        const deviceName = deviceLabel || detectPlatformDeviceName();

        const newBiometricCred: BiometricCredential = {
          id: credId,
          rawId: credId,
          user: {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            photoURL: user.photoURL || null,
          },
          createdAt: new Date().toISOString(),
          deviceName,
          authenticatorAttachment: 'platform',
        };

        // Save credential in localStorage (replace older credential for same user or append)
        const currentList = loadStoredCredentials();
        const filtered = currentList.filter(
          (c) => c.user.uid !== user.uid && c.user.email !== user.email
        );
        const updated = [newBiometricCred, ...filtered];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setEnrolledCredentials(updated);

        const okMsg = `আপনার ডিভাইসের বায়োমেট্রিক (${deviceName}) সফলভাবে সক্রিয় করা হয়েছে!`;
        setSuccess(okMsg);
        setLoading(false);
        return { success: true, credential: newBiometricCred };
      } catch (err: any) {
        console.error('Biometric registration error:', err);
        let errorMsg = 'বায়োমেট্রিক নিবন্ধন সম্পন্ন করা যায়নি।';

        if (err.name === 'NotAllowedError') {
          errorMsg = 'বায়োমেট্রিক স্ক্যান বাতিল করা হয়েছে অথবা সময় শেষ হয়ে গেছে।';
        } else if (err.name === 'SecurityError') {
          errorMsg = 'সুরক্ষা বিধিনিষেধের কারণে আইফ্রেমে বায়োমেট্রিক কাজ নাও করতে পারে। অনুগ্রহ করে নতুন ট্যাবে খুলে চেষ্টা করুন।';
        } else if (err.name === 'InvalidStateError') {
          errorMsg = 'এই ডিভাইসে আপনার বায়োমেট্রিক ইতিমধ্যে নিবন্ধিত রয়েছে।';
        } else if (err.name === 'NotSupportedError') {
          errorMsg = 'আপনার ডিভাইস প্ল্যাটফর্ম বায়োমেট্রিক অনুমোদন সমর্থন করে না।';
        } else if (err.message) {
          errorMsg = err.message;
        }

        setError(errorMsg);
        setLoading(false);
        return { success: false, error: errorMsg };
      }
    },
    [isSupported, loadStoredCredentials, clearError, clearSuccess]
  );

  /**
   * Authenticate / Login using the device's biometrics scanner
   */
  const authenticateWithBiometrics = useCallback(async (): Promise<{
    success: boolean;
    user?: AppAuthUser;
    credentialId?: string;
    error?: string;
  }> => {
    clearError();
    clearSuccess();
    setLoading(true);

    if (!isSupported) {
      const msg = 'আপনার ব্রাউজার বা ডিভাইসে Web Authentication (বায়োমেট্রিক) সমর্থিত নয়।';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }

    const credentialsList = loadStoredCredentials();
    if (credentialsList.length === 0) {
      const msg = 'এই ডিভাইসে কোনো বায়োমেট্রিক ক্রেডেনশিয়াল সংরক্ষিত নেই। অনুগ্রহ করে প্রথমে পাসওয়ার্ড দিয়ে লগইন করে বায়োমেট্রিক চালু করুন।';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }

    try {
      const challenge = window.crypto.getRandomValues(new Uint8Array(32));
      const allowCredentials = credentialsList.map((cred) => ({
        id: base64ToBuffer(cred.id),
        type: 'public-key' as const,
        transports: ['internal'] as AuthenticatorTransport[],
      }));

      const publicKeyCredentialRequestOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
          userVerification: 'required',
          timeout: 60000,
          rpId: window.location.hostname || undefined,
        },
      };

      const assertion = (await navigator.credentials.get(
        publicKeyCredentialRequestOptions
      )) as PublicKeyCredential | null;

      if (!assertion) {
        throw new Error('বায়োমেট্রিক যাচাইকরণ ব্যর্থ হয়েছে।');
      }

      const assertionId = bufferToBase64(assertion.rawId);

      // Match the assertion ID with enrolled credential list
      const matchedCred =
        credentialsList.find(
          (c) => c.id === assertionId || c.rawId === assertionId
        ) || credentialsList[0];

      if (!matchedCred || !matchedCred.user) {
        throw new Error('যাচাইকৃত বায়োমেট্রিকের সাথে কোনো ব্যবহারকারী একাউন্ট মেলেনি।');
      }

      const okMsg = `স্বাগতম ${matchedCred.user.displayName || 'ব্যবহারকারী'}, বায়োমেট্রিক যাচাই সম্পন্ন হয়েছে!`;
      setSuccess(okMsg);
      setLoading(false);

      return {
        success: true,
        user: matchedCred.user,
        credentialId: assertionId,
      };
    } catch (err: any) {
      console.error('Biometric authentication error:', err);
      let errorMsg = 'বায়োমেট্রিক লগইন সম্পন্ন করা যায়নি।';

      if (err.name === 'NotAllowedError') {
        errorMsg = 'বায়োমেট্রিক স্ক্যান বাতিল করা হয়েছে বা আঙুলের ছাপ মেলেনি।';
      } else if (err.name === 'SecurityError') {
        errorMsg = 'আইফ্রেমে বায়োমেট্রিক সীমাবদ্ধ থাকতে পারে। অ্যাপটি ব্রাউজারের মূল ট্যাবে খুলে চেষ্টা করুন।';
      } else if (err.name === 'NotSupportedError') {
        errorMsg = 'এই ব্রাউজার বা ডিভাইসে বায়োমেট্রিক অথেন্টিকেশন সমর্থিত নয়।';
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  }, [isSupported, loadStoredCredentials, clearError, clearSuccess]);

  /**
   * Remove a specific credential
   */
  const removeCredential = useCallback(
    (credentialId: string) => {
      const currentList = loadStoredCredentials();
      const updated = currentList.filter((c) => c.id !== credentialId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setEnrolledCredentials(updated);
      setSuccess('বায়োমেট্রিক ক্রেডেনশিয়াল মুছে ফেলা হয়েছে।');
    },
    [loadStoredCredentials]
  );

  /**
   * Clear all credentials for this browser
   */
  const clearAllCredentials = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setEnrolledCredentials([]);
    setSuccess('এই ডিভাইসের সকল বায়োমেট্রিক মুছে ফেলা হয়েছে।');
  }, []);

  const isEnrolled = enrolledCredentials.length > 0;
  const lastEnrolledUser = isEnrolled ? enrolledCredentials[0].user : null;

  return {
    isSupported,
    isPlatformAuthenticatorAvailable,
    isChecking,
    isEnrolled,
    enrolledCredentials,
    lastEnrolledUser,
    loading,
    error,
    success,
    clearError,
    clearSuccess,
    registerBiometrics,
    authenticateWithBiometrics,
    removeCredential,
    clearAllCredentials,
  };
}
