import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, TwitterAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, getDoc } from "firebase/firestore";
import firebaseConfigJson from "../../firebase-applet-config.json";

// We can fall back to env variables if the JSON config is missing/empty, but use JSON as primary.
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: firebaseConfigJson.authDomain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseConfigJson.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfigJson.storageBucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfigJson.messagingSenderId || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseConfigJson.appId || process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const isFirebaseConfigured = !!firebaseConfig.apiKey;

export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = isFirebaseConfigured ? getAuth(app!) : null;

// Use default database
export const db = isFirebaseConfigured ? getFirestore(app!) : null;

export const googleProvider = new GoogleAuthProvider();
export const twitterProvider = new TwitterAuthProvider();

export { isFirebaseConfigured };
