import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

export { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile };

// Synchronizes and initializes user documents in the 'users' collection
export async function syncUserProfile(user: any) {
  if (!user) return null;
  const userRef = doc(db, "users", user.uid);
  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const isSuperAdmin = user.email === "wootaengboy@gmail.com";
      const userData = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || user.email?.split("@")[0] || "직원",
        isAdmin: isSuperAdmin,
        canPostBlog: isSuperAdmin,
        canPostPortfolio: isSuperAdmin,
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, userData);
      return userData;
    } else {
      return userSnap.data();
    }
  } catch (err) {
    console.error("Error syncing user profile:", err);
    return null;
  }
}
