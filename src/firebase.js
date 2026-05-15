import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
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

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

