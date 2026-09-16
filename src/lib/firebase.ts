import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};
export { increment };
// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with designated databaseId
export const db = getFirestore(app, firebaseConfigData.firestoreDatabaseId || undefined);

// Helper for Google Sign-In (Firebase Auth)
export async function signInWithGoogle(): Promise<{ user: User; idToken: string }> {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return { user: result.user, idToken };
}

// Helper for Email / Password (Firebase Auth)
export async function signInWithEmail(email: string, pass: string): Promise<{ user: User; idToken: string }> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  const idToken = await result.user.getIdToken();
  return { user: result.user, idToken };
}

// Helper for Sign Out (Firebase Auth)
export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

export {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onAuthStateChanged
};
