import React, { useState } from "react";
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
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithGoogle();
      await syncUserProfile(result.user);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      setError("구글 로그인에 실패했습니다. 다시 시도해 주세요.");
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
        await syncUserProfile(result.user);
      } else {
        // Log in user
        const result = await signInWithEmailAndPassword(auth, email, password);
        await syncUserProfile(result.user);
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일 주소입니다.");
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("이메일 또는 비밀번호가 일치하지 않습니다.");
      } else if (err.code === "auth/invalid-credential") {
        setError("로그인 정보가 올바르지 않습니다.");
      } else {
        setError("오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 overflow-hidden border border-gray-100/50"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Heading */}
          <div className="text-center mb-8">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-accent-pink block mb-2">
              CHEOTOL Portal
            </span>
            <h2 className="text-2xl font-serif font-bold text-gray-900">
              {isSignUp ? "직원 계정 등록" : "관리자 / 직원 로그인"}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isSignUp ? "새로운 동료의 계정을 생성합니다." : "서비스 및 콘텐츠 관리를 시작하세요."}
            </p>
          </div>

          {/* Google SSO Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-sans font-bold text-xs rounded-2xl transition-all hover:shadow-md cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.125C18.29 1.157 15.539 0 12.24 0c-6.63 0-12 5.37-12 12s5.37 12 12 12c6.91 0 11.52-4.86 11.52-11.72 0-.788-.08-1.396-.18-1.995H12.24z"
              />
            </svg>
            구글 계정으로 연동 로그인
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-100" />
            <span className="px-3 text-[10px] uppercase font-sans font-black tracking-widest text-gray-300">
              또는 이메일 사용
            </span>
            <div className="flex-grow border-t border-gray-100" />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl"
            >
              {error}
            </motion.div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-sans font-bold tracking-wider text-gray-500">
                  이름 (DISPLAY NAME)
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="홍길동"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full py-3.5 pl-11 pr-4 border border-gray-200 rounded-xl bg-gray-50/30 focus:ring-2 focus:ring-accent-pink/30 outline-none transition-all text-xs text-gray-800"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-sans font-bold tracking-wider text-gray-500">
                이메일 주소 (EMAIL)
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3.5 pl-11 pr-4 border border-gray-200 rounded-xl bg-gray-50/30 focus:ring-2 focus:ring-accent-pink/30 outline-none transition-all text-xs text-gray-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-sans font-bold tracking-wider text-gray-500">
                비밀번호 (PASSWORD)
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3.5 pl-11 pr-11 border border-gray-200 rounded-xl bg-gray-50/30 focus:ring-2 focus:ring-accent-pink/30 outline-none transition-all text-xs text-gray-800"
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
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-sans font-bold tracking-wider text-gray-500">
                  비밀번호 확인 (CONFIRM PASSWORD)
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full py-3.5 pl-11 pr-4 border border-gray-200 rounded-xl bg-gray-50/30 focus:ring-2 focus:ring-accent-pink/30 outline-none transition-all text-xs text-gray-800"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-gray-900 text-white hover:bg-gray-800 cursor-pointer rounded-2xl font-sans font-black uppercase tracking-widest text-[10px] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  처리 중...
                </>
              ) : isSignUp ? (
                "계정 등록 완료"
              ) : (
                "로그인하기"
              )}
            </button>
          </form>

          {/* Toggle Choice Link */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-xs text-gray-500 hover:text-accent-pink transition-colors font-medium border-b border-transparent hover:border-accent-pink/30"
            >
              {isSignUp ? "이미 계정이 있으신가요? 로그인" : "새로운 사원이신가요? 직원 등록 신청"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
