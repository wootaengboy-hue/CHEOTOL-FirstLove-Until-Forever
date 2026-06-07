import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User as UserIcon, X, Globe, Eye, EyeOff, Loader2 } from "lucide-react";
import { 
  auth, 
  signInWithGoogle, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  syncUserProfile 
} from "../firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setIsSignUp(false);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setDisplayName("");
      setShowPassword(false);
      setLoading(false);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithGoogle();
      await syncUserProfile(result.user);
      onClose();
      if (onSuccess) {
        onSuccess();
      } else {
        const isSuperAdmin = result.user.email === "wootaengboy@gmail.com";
        if (isSuperAdmin) {
          navigate("/admin/dashboard");
        }
      }
    } catch (err: any) {
      console.error("Google sign in error details:", err);
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        return;
      }
      
      if (err.code === "auth/unauthorized-domain") {
        setError(`[도메인 미승인] 현재 배포 도메인이 Firebase 콘솔에 허용 등록되지 않았습니다. Firebase 콘솔(Authentication -> Settings -> Authorized domains)에 현재 도메인을 추가해주세요.`);
      } else if (err.code === "auth/popup-blocked") {
        setError("[팝업 차단됨] 브라우저에서 팝업창이 차단되었습니다. 주소창 우측에서 팝업 허용을 활성화하고 다시 시도하시거나, 반드시 새 창/실제 주소로 직접 접속했는지 확인해 주세요.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("[제공업체 비활성화] Firebase 콘솔에서 Google 이메일 로그인 공급업체가 활성화되어 있지 않습니다.");
      } else {
        setError(`구글 로그인 실패: ${err.message || "오류가 발생했습니다."} (에러 코드: ${err.code || "unknown"})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자리 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    try {
      let userObj;
      if (isSignUp) {
        if (!displayName) {
          setError("이름을 입력해 주세요.");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("비밀번호가 일치하지 않습니다.");
          setLoading(false);
          return;
        }

        // Register user
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName });
        await syncUserProfile(result.user, displayName);
        userObj = result.user;
      } else {
        // Log in user
        const result = await signInWithEmailAndPassword(auth, email, password);
        await syncUserProfile(result.user);
        userObj = result.user;
      }

      onClose();
      if (onSuccess) {
        onSuccess();
      } else if (userObj) {
        const isSuperAdmin = userObj.email === "wootaengboy@gmail.com";
        if (isSuperAdmin) {
          navigate("/admin/dashboard");
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일 주소입니다.");
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("이메일 또는 비밀번호가 일치하지 않습니다.");
      } else if (err.code === "auth/invalid-credential") {
        setError("로그인 정보가 올바르지 않습니다.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("이메일/비밀번호 가입 기능이 Firebase 콘솔에서 활성화되어 있지 않습니다. 관리자 콘솔에서 해당 로그인 제공업체(Email/Password)를 활성화해주세요.");
      } else if (err.code === "auth/invalid-email") {
        setError("올바르지 않은 이메일 형식입니다.");
      } else if (err.code === "auth/weak-password") {
        setError("비밀번호가 너무 취약합니다. (최소 6자 이상으로 설정해주세요)");
      } else {
        setError(`오류가 발생했습니다: ${err.message || "잠시 후 다시 시도해 주세요."} (에러 코드: ${err.code || "unknown"})`);
      }
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] overflow-y-auto">
        {/* Backdrop overlay - fixed to viewport so it remains full screen and doesn't scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
        />

        {/* Scrollable Container wrapper to center the card */}
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-10 overflow-hidden border border-gray-100/50 flex flex-col my-8"
          >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Heading */}
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="w-14 h-14 bg-emerald-50 text-[#005a3c] rounded-[1.25rem] flex items-center justify-center mb-5 border border-emerald-100">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-[22px] font-sans font-extrabold text-[#0f172a] tracking-tight">
              {isSignUp ? "관리자 / 직원 계정 등록" : "관리자 인증"}
            </h2>
            <p className="text-[13px] text-gray-400 mt-1 font-medium font-sans">
              {isSignUp ? "새로운 동료의 계정을 생성합니다." : "새마음 안전 관리 시스템에 오신 것을 환영합니다."}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl"
            >
              {error}
            </motion.div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-sans font-bold text-gray-600 block pl-1">
                  직원 이름 *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="이름을 입력해 주세요"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full py-3.5 pl-11 pr-4 border border-gray-200 rounded-xl bg-white focus:border-[#005a3c] focus:ring-1 focus:ring-[#005a3c]/20 outline-none transition-all text-[13px] text-gray-800"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-sans font-bold text-gray-600 block pl-1">
                {isSignUp ? "이메일 주소 *" : "관리자 이메일"}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3.5 pl-11 pr-4 border border-gray-200 rounded-xl bg-white focus:border-[#005a3c] focus:ring-1 focus:ring-[#005a3c]/20 outline-none transition-all text-[13px] text-gray-800"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-sans font-bold text-gray-600 block pl-1">
                비밀번호 *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="비밀번호를 입력해 주세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3.5 pl-11 pr-11 border border-gray-200 rounded-xl bg-white focus:border-[#005a3c] focus:ring-1 focus:ring-[#005a3c]/20 outline-none transition-all text-[13px] text-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-sans font-bold text-gray-600 block pl-1">
                  비밀번호 확인 *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="비밀번호를 다시 입력해 주세요"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full py-3.5 pl-11 pr-4 border border-gray-200 rounded-xl bg-white focus:border-[#005a3c] focus:ring-1 focus:ring-[#005a3c]/20 outline-none transition-all text-[13px] text-gray-800"
                  />
                </div>
              </div>
            )}

             {/* Action Buttons */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-[#005a3c] hover:bg-[#00422c] text-white cursor-pointer rounded-2xl font-sans font-bold text-[14px] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isSignUp ? "계정 등록 중..." : "인증 중..."}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  {isSignUp ? "계정 등록하기" : "로그인 인증하기"}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-100" />
            <span className="px-3 text-[11px] font-sans font-bold text-gray-400 shrink-0">
              또는 간편인증
            </span>
            <div className="flex-grow border-t border-gray-100" />
          </div>

          {/* Google SSO Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-sans font-bold text-[13px] rounded-2xl transition-all hover:shadow-sm cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-0.5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.125C18.29 1.157 15.539 0 12.24 0c-6.63 0-12 5.37-12 12s5.37 12 12 12c6.91 0 11.52-4.86 11.52-11.72 0-.788-.08-1.396-.18-1.995H12.24z"
              />
            </svg>
            구글 계정으로 로그인
          </button>

          {/* Guidelines notes at the bottom */}
          <div className="mt-8 text-left space-y-1.5 border-t border-gray-50 pt-5">
            <p className="text-[10px] text-gray-400 font-medium leading-[1.6] break-keep">
              ※ 등록된 관리자 이메일과 비밀번호를 전산 보안망을 통해 입력하고 로그인할 수 있습니다.
            </p>
            <p className="text-[10px] text-gray-400 font-medium leading-[1.6] break-keep">
              ※ 권한 승인 및 비밀번호 재발급 요구 시 시스템 운영 관리자에게 원격 신청해 주시기 바랍니다.
            </p>
          </div>

          {/* Toggle Choice Link (Discrete option) */}
          <div className="text-center mt-5">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-[11px] text-gray-400 hover:text-[#005a3c] transition-colors font-medium underline underline-offset-2"
            >
              {isSignUp ? "이미 계정이 있으신가요? 관리자 로그인" : "새로운 사원이신가요? 직원 가입 신청"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  </AnimatePresence>,
  document.body
  );
}
