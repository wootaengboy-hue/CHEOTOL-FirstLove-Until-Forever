import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Calendar, CheckCircle2, AlertCircle, ExternalLink, Settings, LogOut } from "lucide-react";
import { auth, logout } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const ADMIN_EMAILS = ["wootaengboy@gmail.com"]; // User's email from metadata

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && ADMIN_EMAILS.includes(u.email || "")) {
        setIsAdmin(true);
        checkConnection();
      } else if (u) {
        setIsAdmin(false);
        setLoading(false);
      } else {
        // Redirect to home if user logs out
        setLoading(false);
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, []);

  const checkConnection = async () => {
    try {
      const res = await fetch("/api/auth/google/status");
      const data = await res.json();
      setIsConnected(data.connected);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await fetch("/api/auth/google");
      const { url } = await res.json();
      const authWindow = window.open(url, "google_auth", "width=600,height=700");
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
          setIsConnected(true);
          window.removeEventListener("message", handleMessage);
        }
      };
      window.addEventListener("message", handleMessage);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-pink"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-8">This page is only accessible by administrators.</p>
        <button 
          onClick={() => navigate("/")}
          className="px-8 py-3 bg-gray-900 text-white rounded-full font-bold uppercase tracking-widest text-xs"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-6 md:px-[5%]">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-sans font-bold text-accent-pink uppercase tracking-[0.3em] mb-4 block">
              Admin Portal
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-black text-gray-900">
              Consultation <span className="italic text-accent-pink/80 font-light">Management</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => logout()}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between"
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
                className="w-full py-4 bg-accent-pink text-gray-900 rounded-2xl font-sans font-bold uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform shadow-lg shadow-accent-pink/20 flex items-center justify-center gap-2"
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
                      await fetch("/api/auth/google/reset", { method: "POST" });
                      setIsConnected(false);
                    }
                  }}
                  className="w-full py-3 text-red-500 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest transition-colors"
                >
                  Disconnect & Reset
                </button>
                <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">
                  To change account, use reset and connect again.
                </p>
              </div>
            )}
          </motion.div>

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
              {isConnected ? (
                <iframe 
                  src={`https://calendar.google.com/calendar/embed?height=600&wkst=1&bgcolor=%23ffffff&ctz=Asia%2FSeoul&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0&mode=WEEK&src=${encodeURIComponent(user.email || "")}`} 
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
              <div className="mt-6 flex justify-end px-4">
                <a 
                  href="https://calendar.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-sans font-bold text-accent-pink uppercase tracking-widest hover:underline"
                >
                  Open in Google Calendar <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
