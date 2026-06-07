import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

export function useGoogleFormLink() {
  const [googleFormLink, setGoogleFormLink] = useState<string>("");

  useEffect(() => {
    const docRef = doc(db, "settings", "chat");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.googleFormLink) {
          setGoogleFormLink(data.googleFormLink);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const openGoogleForm = () => {
    if (googleFormLink) {
      window.open(googleFormLink, "_blank", "noopener,noreferrer");
    } else {
      // Fallback default google form creation page, or clean info
      window.open("https://docs.google.com/forms", "_blank", "noopener,noreferrer");
    }
  };

  return { googleFormLink, openGoogleForm };
}
