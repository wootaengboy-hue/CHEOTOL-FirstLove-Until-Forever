import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

export function useKakaoLink() {
  const [kakaoLink, setKakaoLink] = useState<string>("");

  useEffect(() => {
    const docRef = doc(db, "settings", "chat");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.kakaoLink) {
          setKakaoLink(data.kakaoLink);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const openKakaoChat = () => {
    if (kakaoLink) {
      window.open(kakaoLink, "_blank", "noopener,noreferrer");
    } else {
      // Fallback if not configured yet
      window.open("https://open.kakao.com", "_blank", "noopener,noreferrer");
    }
  };

  return { kakaoLink, openKakaoChat };
}
