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
  apiKey: "AIzaSyBsS4Or2YKRMwfNqg8gBICzoPwpZ0cF1R4",
  authDomain: "sanjiiiii-ee9b7.firebaseapp.com",
  projectId: "sanjiiiii-ee9b7",
  storageBucket: "sanjiiiii-ee9b7.firebasestorage.app",
  messagingSenderId: "299361536396",
  appId: "1:299361536396:web:bfb990a2d5238697ce2ea9",
  measurementId: "G-YNT11HC6HL",
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
export const db = getFirestore(app);
export const storage = getStorage(app);

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

