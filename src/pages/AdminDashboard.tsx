import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Settings, 
  LogOut, 
  Trash2, 
  Clock, 
  Mail, 
  FileText, 
  User as UserIcon, 
  MessageCircle, 
  Shield, 
  Check, 
  Users 
} from "lucide-react";
import { auth, logout, db, syncUserProfile } from "../firebase";
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, setDoc, getDoc } from "firebase/firestore";
import AuthModal from "../components/AuthModal";

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"consultations" | "users">("consultations");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);

  const [kakaoLink, setKakaoLink] = useState("");
  const [isSavingKakao, setIsSavingKakao] = useState(false);
  const [kakaoSaveSuccess, setKakaoSaveSuccess] = useState(false);
  const [googleFormLink, setGoogleFormLink] = useState("");
  const [isSavingGoogleForm, setIsSavingGoogleForm] = useState(false);
  const [googleFormSaveSuccess, setGoogleFormSaveSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Run first-time syncing layout
        await syncUserProfile(u);
        const isSuperAdmin = u.email === "wootaengboy@gmail.com";
        const userRef = doc(db, "users", u.uid);
        
        // Dynamic live listener on this user's profile to adapt interface on instant authorization changes
        unsubUserDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.isAdmin || isSuperAdmin) {
              setIsAdmin(true);
              checkConnection();
            } else {
              setIsAdmin(false);
            }
          } else {
            setIsAdmin(isSuperAdmin);
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore user profile fetch error:", error);
          setIsAdmin(isSuperAdmin);
          setLoading(false);
        });
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  // Fetch consultations in real-time from Firestore when authenticated as admin
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "consultations"), orderBy("submittedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setConsultations(docs);
    }, (error) => {
      console.error("Error fetching consultations in administration portal:", error);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Background Auto-sync unsynced consultations when connection is active
  useEffect(() => {
    if (!isAdmin || !isConnected || consultations.length === 0) return;

    const token = localStorage.getItem("google_calendar_token");
    const expiresStr = localStorage.getItem("google_calendar_token_expires");
    const expired = token && expiresStr && Date.now() > parseInt(expiresStr);
    if (!token || expired) return;

    // Find consultations that have a date, time, are not canceled, and do not have a calendarEventId (and not intentionally un-synced)
    const unsynced = consultations.filter((c: any) => 
      c.date && 
      c.time && 
      (!c.calendarEventId || c.calendarEventId === "") && 
      c.status !== "CANCEL"
    );

    if (unsynced.length === 0) return;

    // To avoid hitting rate limits or multiple concurrent writes on the same elements, parse them one-by-one
    const syncAll = async () => {
      console.log(`Auto-syncing ${unsynced.length} unsynced consultations in background...`);
      for (const c of unsynced) {
        await silentSyncToGoogleCalendar(c);
      }
    };

    syncAll();
  }, [isAdmin, isConnected, consultations]);

  // Fetch users real-time from Firestore when authenticated as admin
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const docs = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          uid: d.id, // Explicitly enforce uid is the document id
          ...data
        };
      });
      // Sort users by registration timestamp
      docs.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setUsersList(docs);
    }, (error) => {
      console.error("Error fetching users list in administration portal:", error);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Fetch existing settings (Kakao Chat & Google Form)
  useEffect(() => {
    if (!isAdmin) return;
    const docRef = doc(db, "settings", "chat");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data) {
          if (data.kakaoLink) {
            setKakaoLink(data.kakaoLink);
          }
          if (data.googleFormLink) {
            setGoogleFormLink(data.googleFormLink);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const handleSaveKakaoLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingKakao(true);
    setKakaoSaveSuccess(false);
    try {
      const docRef = doc(db, "settings", "chat");
      await setDoc(docRef, { kakaoLink: kakaoLink.trim() }, { merge: true });
      setKakaoSaveSuccess(true);
      setTimeout(() => setKakaoSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save Kakao Talk link settings:", err);
      alert("링크를 저장하는 데 실패했습니다. Firestore 권한을 확인해주세요.");
    } finally {
      setIsSavingKakao(false);
    }
  };

  const handleSaveGoogleFormLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGoogleForm(true);
    setGoogleFormSaveSuccess(false);
    try {
      const docRef = doc(db, "settings", "chat");
      await setDoc(docRef, { googleFormLink: googleFormLink.trim() }, { merge: true });
      setGoogleFormSaveSuccess(true);
      setTimeout(() => setGoogleFormSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save Google Form link settings:", err);
      alert("링크를 저장하는 데 실패했습니다. Firestore 권한을 확인해주세요.");
    } finally {
      setIsSavingGoogleForm(false);
    }
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "NEW" ? "CONTACTED" : currentStatus === "CONTACTED" ? "COMPLETED" : currentStatus === "COMPLETED" ? "CANCEL" : "NEW";
      const docRef = doc(db, "consultations", id);

      const target = consultations.find(c => c.id === id);
      if (nextStatus === "CANCEL" && target && target.calendarEventId && target.calendarEventId !== "none") {
        const confirmCancel = confirm("상태를 CANCEL로 변경하면 구글 캘린더에 연동된 일정이 자동으로 삭제됩니다. 계속하시겠습니까?");
        if (!confirmCancel) return;

        await deleteFromGoogleCalendar(target);
        await updateDoc(docRef, { 
          status: nextStatus,
          calendarEventId: "none"
        });
      } else {
        await updateDoc(docRef, { status: nextStatus });
      }
    } catch (err) {
      console.error("Failed to update consultation entry status:", err);
    }
  };

  const handleDeleteConsultation = async (id: string) => {
    const target = consultations.find(c => c.id === id);
    let confirmMsg = "정말 이 상담 신청 내역을 삭제하시겠습니까?";
    if (target && target.calendarEventId && target.calendarEventId !== "none") {
      confirmMsg = "정말 이 상담 신청 내역을 삭제하시겠습니까?\n(구글 캘린더에 연동된 일정도 함께 즉시 삭제됩니다.)";
    }
    
    if (!confirm(confirmMsg)) return;

    try {
      if (target && target.calendarEventId && target.calendarEventId !== "none") {
        await deleteFromGoogleCalendar(target);
      }

      const docRef = doc(db, "consultations", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Failed to delete consultation entry:", err);
      alert("상담 신청 내역을 삭제하는 데 실패했습니다.");
    }
  };

  const handleTogglePermission = async (targetId: string, field: "isAdmin" | "canPostBlog" | "canPostPortfolio", currentValue: boolean) => {
    if (targetId === user?.uid && field === "isAdmin") {
      alert("자신의 관리자 권한은 직접 해제할 수 없습니다.");
      return;
    }
    const targetUser = usersList.find(u => u.uid === targetId);
    if (targetUser?.email === "wootaengboy@gmail.com" && field === "isAdmin") {
      alert("최고 관리자(wootaengboy@gmail.com)의 관리자 권한은 해제할 수 없습니다.");
      return;
    }

    try {
      const userRef = doc(db, "users", targetId);
      await updateDoc(userRef, {
        [field]: !currentValue
      });
    } catch (err) {
      console.error("Failed to update user permission:", err);
      alert("권한을 변경하는 데 실패했습니다.");
    }
  };

  const handleDeleteUser = async (targetId: string) => {
    const targetUser = usersList.find(u => u.uid === targetId);
    if (targetUser?.email === "wootaengboy@gmail.com") {
      alert("최고 관리자 계정은 삭제할 수 없습니다.");
      return;
    }
    if (targetId === user?.uid) {
      alert("자기 자신은 목록에서 삭제할 수 없습니다.");
      return;
    }

    if (!confirm(`사원/사용자 [${targetUser?.displayName || targetUser?.email}] 계정을 관리자 목록에서 완전히 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "users", targetId));
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("사원 계정을 삭제하는 데 실패했습니다.");
    }
  };

  const checkConnection = async () => {
    try {
      let token = localStorage.getItem("google_calendar_token");
      let expiresStr = localStorage.getItem("google_calendar_token_expires");
      let isValid = token && (!expiresStr || Date.now() < parseInt(expiresStr));
      
      // If NOT valid in localStorage, check Firestore settings
      if (!isValid) {
        try {
          const docRef = doc(db, "settings", "google_calendar");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.token && data.expiresAt && Date.now() < data.expiresAt) {
              token = data.token;
              expiresStr = data.expiresAt.toString();
              localStorage.setItem("google_calendar_token", token);
              localStorage.setItem("google_calendar_token_expires", expiresStr);
              isValid = true;
            }
          }
        } catch (dbErr) {
          console.error("Failed to restore google calendar connection from Firestore settings:", dbErr);
        }
      }

      setIsConnected(!!isValid);
      
      if (!isValid) {
        const dismissed = sessionStorage.getItem("google_prompt_dismissed");
        if (dismissed !== "true") {
          setShowGooglePrompt(true);
        }
      }
    } catch (err) {
      console.error("Connection check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/calendar");
      provider.setCustomParameters({ prompt: "consent select_account" });
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token) {
        const expiresAt = Date.now() + 3500 * 1000;
        localStorage.setItem("google_calendar_token", token);
         // Expires in slightly less than an hour (google tokens expire in 3600 seconds)
        localStorage.setItem("google_calendar_token_expires", expiresAt.toString());
        setIsConnected(true);

        try {
          await setDoc(doc(db, "settings", "google_calendar"), {
            token,
            expiresAt,
            connectedAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.error("Failed to save google token to Firestore settings:", dbErr);
        }

        alert("구글 캘린더 연동 및 권한 설정에 성공했습니다!");
      } else {
        throw new Error("구글 계정정보에서 연동 키(Access Token)를 가져오지 못했습니다.");
      }
    } catch (err: any) {
      console.error("Google sync popup error:", err);
      alert(`구글 연동 중 오류가 발생했습니다:\n${err.message || err}`);
    }
  };

  const syncToGoogleCalendar = async (consultation: any) => {
    const token = localStorage.getItem("google_calendar_token");
    const expiresStr = localStorage.getItem("google_calendar_token_expires");
    const expired = token && expiresStr && Date.now() > parseInt(expiresStr);

    if (!token || expired) {
      alert("구글 연동 세션이 만료되었거나 연결되어 있지 않습니다. 우측 화면의 [Connect Google Calendar] 버튼을 눌러 연동을 먼저 진행해 주세요.");
      return;
    }

    const dateStr = consultation.date;
    const timeStr = consultation.time;
    if (!dateStr || !timeStr) {
      alert("상담 일자와 시간이 지정되지 않은 예약입니다. 일정을 지정 후 등록해 주세요.");
      return;
    }

    try {
      const startDateTime = new Date(`${dateStr}T${timeStr}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour

      const eventBody = {
        summary: `[상담] ${consultation.name}님`,
        description: `연락처: ${consultation.contact || consultation.phone || "없음"}\n내용: ${consultation.story || "없음"}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: "Asia/Seoul"
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: "Asia/Seoul"
        },
        attendees: [
          { email: "wootaengboy@daum.net" },
          { email: "wootaengboy@gmail.com" }
        ],
        visibility: "public"
      };

      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(eventBody)
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("google_calendar_token");
          setIsConnected(false);
          throw new Error("구글 로그인 세션 확인에 실패했습니다. 다시 연동을 진행해 주세요.");
        }
        const errData = await response.json();
        throw new Error(errData.error?.message || "Google Calendar API Error");
      }

      const calEvent = await response.json();
      const calendarEventId = calEvent.id;

      // Update in Firestore
      const docRef = doc(db, "consultations", consultation.id);
      await updateDoc(docRef, { calendarEventId });
      alert("구글 캘린더에 예약 일정이 성공적으로 등록되었습니다!");
    } catch (err: any) {
      console.error("Calendar sync error:", err);
      alert(`캘린더 동기화 중 오류가 발생했습니다:\n${err.message || err}`);
    }
  };

  const deleteFromGoogleCalendar = async (consultation: any) => {
    const calendarEventId = consultation.calendarEventId;
    if (!calendarEventId || calendarEventId === "none") return;

    const token = localStorage.getItem("google_calendar_token");
    if (!token) {
      alert("구글 연동 세션이 연결되어 있지 않습니다. 일정 삭제 기능은 생략합니다.");
      return;
    }

    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEventId}?sendUpdates=all`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok && response.status !== 404) {
        if (response.status === 401) {
          localStorage.removeItem("google_calendar_token");
          setIsConnected(false);
          throw new Error("구글 유효 세션이 상실되었습니다. 일정을 직접 수동 취소해 주시기 바랍니다.");
        }
        const errData = await response.json();
        throw new Error(errData.error?.message || "Google Calendar Delete Error");
      }

      // Update in Firestore
      const docRef = doc(db, "consultations", consultation.id);
      await updateDoc(docRef, { calendarEventId: "none" });
    } catch (err: any) {
      console.error("Calendar deletion error:", err);
      alert(`구글 캘린더 일정 삭제 중 오류:\n${err.message || err}`);
    }
  };

  const silentSyncToGoogleCalendar = async (consultation: any) => {
    const token = localStorage.getItem("google_calendar_token");
    if (!token) return;

    try {
      const startDateTime = new Date(`${consultation.date}T${consultation.time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour

      const eventBody = {
        summary: `[상담] ${consultation.name}님`,
        description: `연락처: ${consultation.contact || consultation.phone || "없음"}\n내용: ${consultation.story || "없음"}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: "Asia/Seoul"
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: "Asia/Seoul"
        },
        attendees: [
          { email: "wootaengboy@daum.net" },
          { email: "wootaengboy@gmail.com" }
        ],
        visibility: "public"
      };

      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(eventBody)
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("google_calendar_token");
          setIsConnected(false);
        }
        return;
      }

      const calEvent = await response.json();
      const calendarEventId = calEvent.id;

      const docRef = doc(db, "consultations", consultation.id);
      await updateDoc(docRef, { calendarEventId });
      console.log(`Auto-synced consultation to Google Calendar: ${consultation.name}`);
    } catch (err) {
      console.error("Silent calendar sync error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-pink"></div>
      </div>
    );
  }

  // 1. Unauthorized Gated Screen (Not Logged In)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 pt-32">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-accent-pink/10 rounded-full flex items-center justify-center text-accent-pink mb-6 border border-accent-pink/10">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-serif font-black text-gray-900 mb-2">CHEOTOL 사내 포털</h1>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-sans font-bold mb-6">
            Internal Management System
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mb-8 break-keep">
            이 포털은 첫올 직원 전용 대시보드입니다.<br />
            보안을 위해 사전 권한 또는 인증된 임직원 계정이 있어야만 접속이 허용됩니다. 로그인 또는 신규 등록을 완료하세요.
          </p>
          <button 
            onClick={() => setAuthModalOpen(true)}
            className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white cursor-pointer rounded-2xl font-sans font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-gray-900/20"
          >
            대시보드 로그인 / 직원 가입 신청
          </button>
        </motion.div>
        
        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)} 
        />
      </div>
    );
  }

  // 2. Pending Approval Screen (Logged In but not Authorized Admin/Employee)
  if (user && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 pt-32">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600 mb-6 border border-yellow-200">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-serif font-black text-gray-900 mb-2">사원 승인 대기 중</h1>
          <p className="text-[10px] text-yellow-600 font-extrabold uppercase tracking-widest font-sans mb-6">
            Awaiting Admin Approval
          </p>
          <div className="w-full bg-gray-50 p-5 rounded-2xl text-left border border-gray-100 space-y-2 mb-6">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">사원 이메일:</span>
              <span className="text-gray-800 font-bold font-mono">{user.email}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">사원명:</span>
              <span className="text-gray-800 font-bold">{user.displayName || "가입 완료"}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">요청 상태:</span>
              <span className="font-extrabold text-yellow-600 animate-pulse flex items-center gap-1.5 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">
                권한 승인 검토 중
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-8 break-keep">
            사원 가입 절차가 정상적으로 완료되었습니다. 최고 관리자(wootaengboy@gmail.com)가 귀하의 메일 주소를 확인하여 블로그 작성 또는 포트폴리오 관리 권한을 시스템 내에서 제공해야 합니다. 권한이 부여되면 본 화면이 즉시 대시보드로 자동 전환됩니다.
          </p>
          <div className="flex w-full gap-3">
            <button 
              onClick={() => navigate("/")}
              className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-sans font-bold text-xs transition-transform hover:scale-[1.01]"
            >
              홈페이지로 이동
            </button>
            <button 
              onClick={() => logout()}
              className="flex-1 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-sans font-bold text-xs transition-transform hover:scale-[1.01]"
            >
              로그아웃 (Sign Out)
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-6 md:px-[5%]">
      {/* Modern Google Calendar Connect Prompt Modal */}
      {showGooglePrompt && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-accent-pink/10 rounded-2xl flex items-center justify-center text-accent-pink mb-6 border border-accent-pink/5">
              <Calendar className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-serif font-black text-gray-900 mb-2">구글 캘린더 연동 안내</h2>
            <p className="text-[10px] text-accent-pink font-extrabold uppercase tracking-widest font-sans mb-4">
              Google Calendar Sync Recommended
            </p>
            <p className="text-sm text-gray-500 leading-relaxed mb-8 break-keep">
              현재 첫올 계정에 구글 캘린더가 예약 연동되어 있지 않습니다.<br />
              고객이 실시간으로 예약 및 상담을 신청할 때 임직원의 구글 캘린더 일정이 자동으로 동기화되도록 지금 계정을 연동하시겠습니까?
            </p>
            <div className="flex w-full gap-3">
              <button 
                onClick={() => {
                  setShowGooglePrompt(false);
                  sessionStorage.setItem("google_prompt_dismissed", "true");
                }}
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-sans font-bold text-xs transition-transform hover:scale-[1.01] cursor-pointer"
              >
                나중에 하기
              </button>
              <button 
                onClick={async () => {
                  setShowGooglePrompt(false);
                  sessionStorage.setItem("google_prompt_dismissed", "true");
                  await handleConnect();
                }}
                className="flex-1 py-3.5 bg-accent-pink text-gray-900 rounded-xl font-sans font-bold uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-accent-pink/20 cursor-pointer"
              >
                지금 연동하기
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs font-sans font-bold text-accent-pink uppercase tracking-[0.3em] mb-4 block">
              Admin Portal
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-black text-gray-900">
              Internal <span className="italic text-accent-pink/80 font-light text-3xl md:text-5xl">Management</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => logout()}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </header>

        {/* Tab Selection */}
        <div className="flex gap-6 border-b border-gray-200 mb-10 pb-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("consultations")}
            className={`pb-3 text-xs md:text-sm font-sans font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "consultations"
                ? "border-accent-pink text-gray-950"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            상담 관리 및 예약 연동 (Consultations)
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 text-xs md:text-sm font-sans font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "users"
                ? "border-accent-pink text-gray-950"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            사원 및 업로드 권한 관리 (Staff Roles)
          </button>
        </div>

        {/* TAB 1: Consultations View */}
        {activeTab === "consultations" && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column Settings Cards */}
              <div className="lg:col-span-1 flex flex-col gap-8">
                {/* Status Card (Google Calendar) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-12 h-12 bg-accent-pink/10 rounded-2xl flex items-center justify-center text-accent-pink">
                        <Settings className="w-6 h-6" />
                      </div>
                      {isConnected ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3" /> Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-bold rounded-full uppercase tracking-widest">
                          <AlertCircle className="w-3 h-3" /> Disconnected
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">Google Calendar</h2>
                    <p className="text-gray-500 font-sans text-sm leading-relaxed mb-8">
                      상담 고객의 예약 정보가 자동으로 관리자의 구글 캘린더에 동기화되도록 연동합니다.
                    </p>
                  </div>
                  
                  {!isConnected ? (
                    <button 
                      onClick={handleConnect}
                      className="w-full py-4 bg-accent-pink text-gray-900 rounded-2xl font-sans font-bold uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform shadow-lg shadow-accent-pink/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Connect Google Calendar
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <button 
                        disabled
                        className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-sans font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Already Connected
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm("연동을 해제하시겠습니까?")) {
                            localStorage.removeItem("google_calendar_token");
                            localStorage.removeItem("google_calendar_token_expires");
                            setIsConnected(false);
                            try {
                              await setDoc(doc(db, "settings", "google_calendar"), {
                                token: null,
                                expiresAt: null,
                                disconnectedAt: new Date().toISOString()
                              });
                            } catch (dbErr) {
                              console.error("Failed to remove token from Firestore:", dbErr);
                            }
                            alert("구글 연동이 성공적으로 해제되었습니다.");
                          }
                        }}
                        className="w-full py-3 text-red-500 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                      >
                        Disconnect & Reset
                      </button>
                      <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">
                        To change account, use reset and connect again.
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Kakao Settings Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-[#FAE100]/20 rounded-2xl flex items-center justify-center text-[#3C1E1E]">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-bold text-gray-900">카카오톡 연동 설정</h2>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Kakao Talk Integration</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-500 font-sans text-sm leading-relaxed mb-6">
                    고객이 '실시간 상담하기' 버튼을 클릭할 때 연결할 카카오톡 오픈채팅방 또는 채널 링크를 관리합니다.
                  </p>

                  <form onSubmit={handleSaveKakaoLink} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-sans font-bold text-gray-700 uppercase tracking-wider">
                        오픈채팅 / 카톡 채널 링크
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://open.kakao.com/o/..."
                        value={kakaoLink}
                        onChange={(e) => setKakaoLink(e.target.value)}
                        className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50/50 focus:ring-2 focus:ring-[#FAE100] outline-none transition-all font-mono text-xs text-gray-800"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingKakao}
                      className="w-full py-4 bg-[#FAE100] text-[#3C1E1E] rounded-2xl font-sans font-bold uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-transform shadow-lg shadow-[#FAE100]/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSavingKakao ? "저장 중..." : kakaoSaveSuccess ? "저장되었습니다! ✓" : "카톡 링크 저장하기"}
                    </button>
                  </form>
                </motion.div>

                {/* Google Form Settings Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-serif font-bold text-gray-950 whitespace-nowrap">구글 폼 연동 설정</h2>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Google Form Integration</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-500 font-sans text-sm leading-relaxed mb-6">
                    상담 예약 완료 후 디테일하게 '나의 이야기'나 '상담 신청 양식'을 작성하도록 유도할 구글 폼 링크를 설정합니다.
                  </p>

                  <form onSubmit={handleSaveGoogleFormLink} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-sans font-bold text-gray-700 uppercase tracking-wider">
                        구글 설문지(Google Form) 링크
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://docs.google.com/forms/d/e/..."
                        value={googleFormLink}
                        onChange={(e) => setGoogleFormLink(e.target.value)}
                        className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50/50 focus:ring-2 focus:ring-purple-500 outline-none transition-all font-mono text-xs text-gray-800"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingGoogleForm}
                      className="w-full py-4 bg-purple-600 text-white rounded-2xl font-sans font-bold uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-transform shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSavingGoogleForm ? "저장 중..." : googleFormSaveSuccess ? "저장되었습니다! ✓" : "구글 폼 링크 저장하기"}
                    </button>
                  </form>
                </motion.div>
              </div>

              {/* Calendar Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2 bg-white p-4 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 min-h-[600px] flex flex-col"
              >
                <div className="flex items-center gap-3 mb-6 px-4 pt-4">
                  <Calendar className="w-5 h-5 text-accent-pink" />
                  <h2 className="text-xl font-serif font-bold text-gray-900">Consultation Schedule</h2>
                </div>
                
                <div className="flex-grow bg-gray-50 rounded-[2rem] overflow-hidden relative border border-gray-100">
                  {isConnected && user ? (
                    <iframe 
                      src={`https://calendar.google.com/calendar/embed?height=600&wkst=1&bgcolor=%23ffffff&ctz=Asia%2FSeoul&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0&mode=MONTH&src=${encodeURIComponent(user.email || "")}`} 
                      style={{ border: 0 }} 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no"
                      className="absolute inset-0"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                      <Calendar className="w-16 h-16 text-gray-200 mb-6" />
                      <h3 className="text-lg font-serif font-bold text-gray-900 mb-2">연동이 필요합니다</h3>
                      <p className="text-sm text-gray-500 max-w-xs">
                        좌측의 [Connect Google Calendar] 버튼을 눌러 연동을 완료하면 이 공간에 상담 일정이 표시됩니다.
                      </p>
                    </div>
                  )}
                </div>
                
                {isConnected && (
                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4">
                    <p className="text-[11px] text-gray-500 leading-relaxed bg-amber-50/60 border border-amber-100 rounded-xl px-3.5 py-2">
                       💡 <strong>캘린더가 [바쁨]으로 표시되나요?</strong> 연동되는 일정 자체는 이름과 함께 <strong>공개(Public)</strong>로 생성되나, 캘린더 자체의 공개 권한이 제한되면 외부에서 제목이 가려집니다. 구글 캘린더 설정 &gt; 내 캘린더 설정 &gt; <strong>'공개 사용 설정'</strong> 하단의 권한 설정을 <strong>'모든 일정 세부정보 보기'</strong>로 승인해 주세요.
                    </p>
                    <a 
                      href="https://calendar.google.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-sans font-bold text-accent-pink uppercase tracking-widest hover:underline shrink-0"
                    >
                      Open in Google Calendar <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Consultations List Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-accent-pink" />
                  <h2 className="text-2xl font-serif font-bold text-gray-900">
                    상담 신청 목록 <span className="text-sm font-sans font-normal text-gray-400">({consultations.length}건)</span>
                  </h2>
                </div>
                <div className="w-full sm:w-auto bg-white border border-gray-100/90 p-2 sm:p-2.5 rounded-2xl shadow-xs grid grid-cols-2 sm:flex gap-2">
                  <span className="inline-flex items-center justify-center px-3 py-2.5 sm:py-1 bg-red-50 text-red-600 text-xs sm:text-[10px] font-extrabold rounded-xl uppercase tracking-wider font-sans whitespace-nowrap">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                    New
                  </span>
                  <span className="inline-flex items-center justify-center px-3 py-2.5 sm:py-1 bg-blue-50 text-blue-600 text-xs sm:text-[10px] font-extrabold rounded-xl uppercase tracking-wider font-sans whitespace-nowrap">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                    Contacted
                  </span>
                  <span className="inline-flex items-center justify-center px-3 py-2.5 sm:py-1 bg-green-50 text-green-600 text-xs sm:text-[10px] font-extrabold rounded-xl uppercase tracking-wider font-sans whitespace-nowrap">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                    Completed
                  </span>
                  <span className="inline-flex items-center justify-center px-3 py-2.5 sm:py-1 bg-gray-100 text-gray-500 text-xs sm:text-[10px] font-extrabold rounded-xl uppercase tracking-wider font-sans whitespace-nowrap">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></span>
                    Cancel
                  </span>
                </div>
              </div>

              {consultations.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                  <p className="font-sans text-sm">접수된 상담 신청 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-wider">
                        <th className="py-4 px-4">신청일시</th>
                        <th className="py-4 px-4">신청자</th>
                        <th className="py-4 px-4">연락처</th>
                        <th className="py-4 px-4">희망 일정</th>
                        <th className="py-4 px-4">접수 경로</th>
                        <th className="py-4 px-4">상세 문의내용</th>
                        <th className="py-4 px-4 text-center">상태 관리</th>
                        <th className="py-4 px-4 text-right">삭제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs font-sans">
                      {consultations.map((c) => (
                        <tr key={c.id} className="hover:bg-warm-beige/10 transition-colors group">
                          <td className="py-4 px-4 font-mono text-gray-500 whitespace-nowrap">
                            {c.submittedAt ? (
                              <>
                                <div>{new Date(c.submittedAt).toLocaleDateString()}</div>
                                <div className="text-[10px] text-gray-400">
                                  {new Date(c.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </>
                            ) : "-"}
                          </td>
                          <td className="py-4 px-4 font-bold text-gray-900 whitespace-nowrap">
                            {c.name}
                          </td>
                          <td className="py-4 px-4 font-mono select-all text-gray-700 font-medium whitespace-nowrap">
                            {c.contact}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            {c.date ? (
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-gray-800">{c.date}</span>
                                  {c.calendarEventId && c.calendarEventId !== "none" ? (
                                    <div className="flex items-center gap-1">
                                      <span className="inline-flex items-center text-[10px] text-green-600 font-sans font-semibold bg-green-50 border border-green-200/50 rounded px-1.5 py-0.5">
                                        <Calendar className="w-3 h-3 mr-0.5" /> 연동됨
                                      </span>
                                      <button
                                        onClick={() => {
                                          if (confirm("이 예약을 구글 캘린더에서 제거하시겠습니까?")) {
                                            deleteFromGoogleCalendar(c);
                                          }
                                        }}
                                        className="text-[10px] text-red-500 hover:text-red-700 underline ml-1 cursor-pointer"
                                        title="구글 캘린더에서 일정 삭제"
                                      >
                                        제거
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => syncToGoogleCalendar(c)}
                                      className="inline-flex items-center text-[10px] text-accent-pink font-sans font-black bg-accent-pink/5 border border-accent-pink/30 hover:bg-accent-pink hover:text-white rounded px-2 py-0.5 transition-colors cursor-pointer"
                                      title="구글 캘린더에 일정 등록"
                                    >
                                      📅 캘린더 등록
                                    </button>
                                  )}
                                </div>
                                <span className="text-gray-400 text-[10px] font-mono">{c.time}</span>
                              </div>
                            ) : "-"}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                              {c.source || "Unknown"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-600 select-all font-light break-keep line-clamp-3 max-w-[250px]" title={c.story}>
                            {c.story}
                          </td>
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleUpdateStatus(c.id, c.status || "NEW")}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all min-w-[90px] border cursor-pointer ${
                                c.status === "COMPLETED" 
                                  ? "bg-green-50 text-green-700 border-green-200/50 hover:bg-green-100"
                                  : c.status === "CONTACTED"
                                  ? "bg-blue-50 text-blue-700 border-blue-200/50 hover:bg-blue-100"
                                  : c.status === "CANCEL"
                                  ? "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                                  : "bg-red-50 text-red-700 border-red-200/50 animate-pulse hover:bg-red-100"
                              }`}
                            >
                              {c.status || "NEW"}
                            </button>
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteConsultation(c.id)}
                              className="text-gray-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors inline-block cursor-pointer group-hover:opacity-100 md:opacity-0"
                              title="삭제"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* TAB 2: Employee Permission Management */}
        {activeTab === "users" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-gray-100"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-serif font-black text-gray-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-accent-pink" />
                  사원 및 업로드 통합 권한 설정
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  가입한 사원들의 블로그 포스팅 권한 및 포트폴리오 관리 권한을 실시간으로 제어합니다.
                </p>
              </div>
              <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest font-sans">
                사원 정원: {usersList.length}명 등록 중
              </div>
            </div>

            {/* 사원 등록 안내 가이드 박스 */}
            <div className="mb-8 p-6 bg-[#FAF9F5] border border-gray-100 rounded-[2rem] text-xs leading-relaxed text-gray-600 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
                  <Shield className="w-4 h-4 text-accent-pink" />
                  새로운 사원 / 직원 계정 등록 절차안내
                </div>
                <p className="text-gray-500">
                  사원 및 직원이 대시보드를 이용하려면 <strong>첫올 홈페이지에서 직접 회원가입(이메일 또는 구글)</strong>을 먼저 진행해야 합니다. 
                  가입을 완료하면 본 목록에 이메일이 실시간으로 동기화되어 나타나며, 관리자가 우측의 <strong>권한 버튼(블로그/포트폴리오/관리자)</strong>을 클릭해 부여해주시면 대시보드 권한이 활성화됩니다.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-4 px-4">등록 사원명 및 계정 이메일</th>
                    <th className="py-4 px-4 text-center">블로그 쓰기 권한</th>
                    <th className="py-4 px-4 text-center">포트폴리오 업로드 권한</th>
                    <th className="py-4 px-4 text-center">관리자 역할 지정</th>
                    <th className="py-4 px-4">사원 승인 일시</th>
                    <th className="py-4 px-4 text-right">계정 삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-sans">
                  {usersList.map((u) => {
                    const isRoot = u.email === "wootaengboy@gmail.com";
                    return (
                      <tr key={u.id} className="hover:bg-warm-beige/10 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-accent-pink/10 rounded-full flex items-center justify-center text-accent-pink font-bold text-sm">
                              {u.displayName?.[0] || u.email?.[0]?.toUpperCase() || "직"}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                {u.displayName || "가입형 사원"}
                                {isRoot && (
                                  <span className="text-[8px] bg-red-100 text-red-600 font-sans font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    Root Manager
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-400 text-[10px] font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Blog Post Permission Toggle */}
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleTogglePermission(u.uid, "canPostBlog", u.canPostBlog || false)}
                            disabled={isRoot}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all min-w-[80px] border cursor-pointer ${
                              u.canPostBlog 
                                ? "bg-green-50 text-green-700 border-green-200/50 hover:bg-green-100" 
                                : "bg-gray-100 text-gray-400 border-gray-200/50 hover:bg-gray-200"
                            }`}
                          >
                            {u.canPostBlog ? "허용 ✓" : "차단"}
                          </button>
                        </td>

                        {/* Portfolio Upload Permission Toggle */}
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleTogglePermission(u.uid, "canPostPortfolio", u.canPostPortfolio || false)}
                            disabled={isRoot}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all min-w-[80px] border cursor-pointer ${
                              u.canPostPortfolio 
                                ? "bg-green-50 text-green-700 border-green-200/50 hover:bg-green-100" 
                                : "bg-gray-100 text-gray-400 border-gray-200/50 hover:bg-gray-200"
                            }`}
                          >
                            {u.canPostPortfolio ? "허용 ✓" : "차단"}
                          </button>
                        </td>

                        {/* Full Admin Capability Toggle */}
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleTogglePermission(u.uid, "isAdmin", u.isAdmin || false)}
                            disabled={isRoot || u.uid === user?.uid}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all min-w-[80px] border cursor-pointer ${
                              u.isAdmin 
                                ? "bg-purple-50 text-purple-700 border-purple-200/50 hover:bg-purple-100" 
                                : "bg-gray-100 text-gray-400 border-gray-200/50 hover:bg-gray-200"
                            }`}
                          >
                            {u.isAdmin ? "관리자" : "사원"}
                          </button>
                        </td>

                        {/* Signed Up Timestamp */}
                        <td className="py-4 px-4 text-gray-500 font-mono whitespace-nowrap">
                          {u.createdAt ? (
                            <>
                              <div>{new Date(u.createdAt).toLocaleDateString()}</div>
                              <div className="text-[10px] text-gray-400">
                                {new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </>
                          ) : "정보 없음"}
                        </td>

                        {/* Delete User/Employee */}
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.uid)}
                            disabled={isRoot || u.uid === user?.uid}
                            className={`p-2 rounded-lg text-gray-300 transition-colors inline-block cursor-pointer ${
                              isRoot || u.uid === user?.uid 
                                ? "opacity-35 cursor-not-allowed" 
                                : "hover:text-red-500 hover:bg-red-50"
                            }`}
                            title="사원 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
