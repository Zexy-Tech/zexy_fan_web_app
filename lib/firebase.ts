// The Firebase SDK is loaded on demand (dynamic import) so it never weighs down page bundles:
// Firestore only when a chat screen subscribes, Auth only when "Continue with Google" is tapped.
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export async function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (typeof window === 'undefined') return null;
  if (!firebaseConfig.projectId) {
    return null;
  }
  if (app) return app;
  const { initializeApp, getApps, getApp } = await import('firebase/app');
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  } catch (err) {
    console.warn('[Firebase] Initialization error:', err);
    return null;
  }
  return app;
}

export async function getFirestoreDb(): Promise<Firestore | null> {
  if (typeof window === 'undefined') return null;
  if (db) return db;
  const firebaseApp = await getFirebaseApp();
  if (!firebaseApp) return null;
  try {
    const { getFirestore } = await import('firebase/firestore');
    db = getFirestore(firebaseApp);
    return db;
  } catch (err) {
    console.warn('[Firestore] getFirestore error:', err);
    return null;
  }
}

async function getFirebaseAuth(): Promise<Auth | null> {
  if (typeof window === 'undefined') return null;
  if (auth) return auth;
  const firebaseApp = await getFirebaseApp();
  if (!firebaseApp) return null;
  try {
    const { getAuth } = await import('firebase/auth');
    auth = getAuth(firebaseApp);
    return auth;
  } catch (err) {
    console.warn('[Firebase] getAuth error:', err);
    return null;
  }
}

export interface GoogleSignInResult {
  idToken: string;
  name: string | null;
  email: string | null;
  photoUrl: string | null;
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const firebaseAuth = await getFirebaseAuth();
  if (!firebaseAuth) {
    throw new Error('Firebase Auth is not initialized. Please verify your Firebase configuration in .env.local.');
  }

  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(firebaseAuth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  const idToken = credential?.idToken || (await result.user.getIdToken());
  if (!idToken) {
    throw new Error('Failed to obtain Google authentication token.');
  }

  return {
    idToken,
    name: result.user.displayName,
    email: result.user.email,
    photoUrl: result.user.photoURL,
  };
}

/**
 * Eager-load the Auth SDK code while the sign-in UI is open, so the tap on "Continue with Google"
 * opens the popup immediately (browsers block popups that open long after the tap).
 * Only the modules are fetched: calling getAuth() here would also boot Google's ~150 KB auth iframe.
 */
export function preloadGoogleSignIn(): void {
  void import('firebase/app');
  void import('firebase/auth');
}
