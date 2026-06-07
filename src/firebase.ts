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
export async function syncUserProfile(user: any, customDisplayName?: string) {
  if (!user) return null;
  const userRef = doc(db, "users", user.uid);
  try {
    const userSnap = await getDoc(userRef);
    const isSuperAdmin = user.email === "wootaengboy@gmail.com";
    
    if (!userSnap.exists()) {
      const resolvedDisplayName = customDisplayName || user.displayName || user.email?.split("@")[0] || "직원";
      const userData = {
        uid: user.uid,
        email: user.email || "",
        displayName: resolvedDisplayName,
        isAdmin: isSuperAdmin,
        canPostBlog: isSuperAdmin,
        canPostPortfolio: isSuperAdmin,
        createdAt: new Date().toISOString()
      };
      console.log("Creating new user profile document in Firestore 'users' collection:", userData);
      await setDoc(userRef, userData);
      return userData;
    } else {
      const existingData = userSnap.data();
      // Ensure uid and email fields are present, and if customDisplayName is provided, update it
      const resolvedDisplayName = customDisplayName || existingData.displayName || user.displayName || user.email?.split("@")[0] || "직원";
      
      const updateData: any = {
        uid: user.uid,
        email: existingData.email || user.email || "",
        displayName: resolvedDisplayName
      };
      
      // If the super admin logs in, ensure their permission is synced
      if (isSuperAdmin) {
        updateData.isAdmin = true;
        updateData.canPostBlog = true;
        updateData.canPostPortfolio = true;
      }
      
      await setDoc(userRef, updateData, { merge: true });
      return { ...existingData, ...updateData };
    }
  } catch (err) {
    console.error("CRITICAL ERROR: Failed to sync user profile in 'users' collection in Firestore:", err);
    return null;
  }
}
