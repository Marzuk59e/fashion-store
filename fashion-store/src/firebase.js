import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  initializeAuth,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

/** Storefront shoppers — persists across visits (default local persistence). */
export const auth = getAuth(app);

/** Admin panel — separate Auth instance + tab session only (not shared with storefront). */
const ADMIN_APP_NAME = "admin-sanjiiiii";
const adminApp = getApps().some((a) => a.name === ADMIN_APP_NAME)
  ? getApps().find((a) => a.name === ADMIN_APP_NAME)
  : initializeApp(firebaseConfig, ADMIN_APP_NAME);
let _adminAuth;
try {
  _adminAuth = initializeAuth(adminApp, { persistence: browserSessionPersistence });
} catch {
  _adminAuth = getAuth(adminApp);
}
export const adminAuth = _adminAuth;

export const googleProvider = new GoogleAuthProvider();
/** Storefront Firestore — uses storefront `auth` token in security rules. */
export const db = getFirestore(app);
export const storage = getStorage(app);
/** Admin panel Firestore/Storage — must pair with `adminAuth` (same Firebase app). */
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);

/** True when this Firebase UID is an admin (not a storefront customer). */
export async function isAdminAccountUid(uid) {
  if (!uid) return false;
  try {
    const adminSnap = await getDoc(doc(db, "admins", uid));
    if (adminSnap.exists() && adminSnap.data()?.active === true) return true;
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) return false;
    const d = userSnap.data() || {};
    return d.role === "admin" || d.profile?.role === "admin";
  } catch {
    return false;
  }
}

export default app;
