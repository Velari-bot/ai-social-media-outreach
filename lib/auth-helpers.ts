import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  User
} from 'firebase/auth';

/**
 * Check if Firebase auth is available
 */
function ensureAuth() {
  if (!auth) {
    throw new Error('Firebase auth is not configured. Please set NEXT_PUBLIC_FIREBASE_API_KEY and other Firebase config in your .env.local file. See FIREBASE_SETUP.md for instructions.');
  }
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
  return !!auth && !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
}


export async function signIn(email: string, password: string): Promise<User> {
  if (typeof window === 'undefined') {
    throw new Error('Sign in can only be called on the client side');
  }

  ensureAuth();

  if (!auth) {
    throw new Error('Firebase auth is not initialized. Please check your Firebase configuration.');
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === '') {
    throw new Error('Firebase API key is not set. Please add NEXT_PUBLIC_FIREBASE_API_KEY to your .env.local file.');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address.');
  }

  // Validate password
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Sign in error:', error);

    let errorMessage = error?.message || 'Failed to sign in. Please try again.';

    if (error?.code === 'auth/invalid-api-key' || error?.message?.includes('API key not valid')) {
      errorMessage = 'Invalid Firebase API key. Please check your .env.local file.';
    } else if (error?.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address format.';
    } else if (error?.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled. Please contact support.';
    } else if (error?.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.';
    } else if (error?.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please try again.';
    } else if (error?.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid email or password.';
    } else if (error?.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later.';
    } else if (error?.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    }

    const newError: any = new Error(errorMessage);
    // Preserve the original error code for logic handling
    newError.code = error?.code;
    newError.originalError = error;
    throw newError;
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string): Promise<User> {
  if (typeof window === 'undefined') {
    throw new Error('Sign up can only be called on the client side');
  }

  ensureAuth();

  if (!auth) {
    throw new Error('Firebase auth is not initialized. Please check your Firebase configuration.');
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === '') {
    throw new Error('Firebase API key is not set. Please add NEXT_PUBLIC_FIREBASE_API_KEY to your .env.local file.');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address.');
  }

  // Validate password
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Send verification email
    try {
      await sendEmailVerification(userCredential.user);
    } catch (verifyError) {
      // Don't fail signup if email verification fails
      console.warn('Failed to send verification email:', verifyError);
    }
    return userCredential.user;
  } catch (error: any) {
    console.error('Sign up error:', error);

    let errorMessage = error?.message || 'Failed to create account. Please try again.';

    if (error?.code === 'auth/invalid-api-key' || error?.message?.includes('API key not valid')) {
      errorMessage = 'Invalid Firebase API key. Please check your .env.local file.';
    } else if (error?.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address format.';
    } else if (error?.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email already exists. Please sign in instead.';
    } else if (error?.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please use a stronger password.';
    } else if (error?.code === 'auth/operation-not-allowed') {
      errorMessage = 'Email/password authentication is not enabled. Please contact support.';
    } else if (error?.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    }

    const newError: any = new Error(errorMessage);
    // Preserve the original error code for logic handling
    newError.code = error?.code;
    newError.originalError = error;
    throw newError;
  }
}

/**
 * Sign in with Google using redirect (more reliable than popup)
 */
/**
 * Sign in with Google using Popup (more reliable for local dev & SPAs)
 */
export async function signInWithGoogle(): Promise<User | null> {
  if (typeof window === 'undefined') {
    throw new Error('Google sign-in can only be called on the client side');
  }

  ensureAuth();

  if (!auth) {
    throw new Error('Firebase auth is not initialized. Please check your Firebase configuration.');
  }

  // Check if API key is valid
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === '') {
    throw new Error('Firebase API key is not set. Please add NEXT_PUBLIC_FIREBASE_API_KEY to your .env.local file. See FIREBASE_SETUP.md for instructions.');
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    // Use popup instead of redirect for better UX and local dev stability
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    // Check for API key errors
    if (error?.code === 'auth/invalid-api-key' || error?.message?.includes('API key not valid')) {
      throw new Error('Invalid Firebase API key. Please check your .env.local file and ensure NEXT_PUBLIC_FIREBASE_API_KEY is correct. See FIREBASE_SETUP.md for instructions.');
    }
    // Check for auth domain errors
    if (error?.code === 'auth/unauthorized-domain') {
      throw new Error('Unauthorized domain. Please add your domain to Firebase Console > Authentication > Settings > Authorized domains.');
    }
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign in cancelled');
    }
    throw error;
  }
}

/**
 * Get the result of Google sign-in redirect
 * @deprecated Use signInWithGoogle (popup) instead
 */
export async function getGoogleAuthResult(): Promise<User | null> {
  return null;
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  ensureAuth();
  await sendPasswordResetEmail(auth!, email);
}

/**
 * Get current user
 */
export function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    if (!auth) {
      resolve(null);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

