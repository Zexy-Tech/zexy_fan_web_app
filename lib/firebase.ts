import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCTmTaDAfYUU_ALZRp8Px0HDCD8KaEY2d4',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'zexy-dev.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'zexy-dev',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'zexy-dev.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '292392470573',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:292392470573:web:de0a09aa42288aec4690a4',
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  if (!firebaseConfig.projectId) {
    return null;
  }
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (err) {
      console.warn('[Firebase] Initialization error:', err);
      return null;
    }
  } else {
    app = getApp();
  }
  return app;
}

export function getFirestoreDb(): Firestore | null {
  if (typeof window === 'undefined') return null;
  if (db) return db;
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  try {
    db = getFirestore(firebaseApp);
    return db;
  } catch (err) {
    console.warn('[Firestore] getFirestore error:', err);
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  if (auth) return auth;
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  try {
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
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) {
    throw new Error('Firebase Auth is not initialized. Please verify your Firebase configuration in .env.local.');
  }

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
