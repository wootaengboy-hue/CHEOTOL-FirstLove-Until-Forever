import { useState, useEffect } from "react";
import { Compass, X, AlertTriangle, ExternalLink } from "lucide-react";

export default function InAppBrowserWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [browserType, setBrowserType] = useState<"kakao" | "instagram" | "other" | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || "";
    const agentToLower = userAgent.toLowerCase();
    
    const isAndroid = /android/i.test(agentToLower);
    const isIos = /iphone|ipad|ipod/i.test(agentToLower);
    setIsIOS(isIos);

    const isKakao = /kakaotalk/i.test(agentToLower);
    const isInstagram = /instagram/i.test(agentToLower);
    const isFB = /fbav|fb_iab/i.test(agentToLower);
    const isLine = /line/i.test(agentToLower);
    const isNaver = /naver/i.test(agentToLower);

    const isInApp = isKakao || isInstagram || isFB || isLine || isNaver;

    // 1. Android + KakaoTalk (or other WebView) automatic escape via chrome intent
    if (isAndroid && isInApp) {
      // Reconstruct clean destination URL
      const currentUrl = window.location.href.replace(/https?:\/\//, "");
      const intentUrl = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      
      // Attempt redirect to Chrome
      window.location.href = intentUrl;
      return;
    }

    // 2. iOS + In-app browsers require manual open in Safari warning banner
    if (isIos && isInApp) {
      // Check if user already dismissed it in this session
      const isDismissed = sessionStorage.getItem("in_app_warning_dismissed") === "true";
      if (!isDismissed) {
        setShowWarning(true);
        if (isKakao) {
          setBrowserType("kakao");
        } else if (isInstagram) {
          setBrowserType("instagram");
        } else {
          setBrowserType("other");
        }
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowWarning(false);
    sessionStorage.setItem("in_app_warning_dismissed", "true");
  };

  if (!showWarning) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] animate-fade-in px-4 py-3 bg-rose-50 border-b border-rose-100 shadow-md">
      <div className="max-w-6xl mx-auto flex items-start gap-3 relative">
        <div className="p-1.5 bg-rose-100 rounded-lg text-rose-600 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0 pr-6">
          <h4 className="font-sans font-bold text-gray-900 text-xs sm:text-sm tracking-wide mb-1 flex items-center gap-1.5">
            구글 로그인 제한 안내 (인앱 브라우저 감지)
          </h4>
          <p className="font-sans text-gray-700 text-[11px] sm:text-xs leading-relaxed break-keep">
            {browserType === "kakao" ? (
              <>
                현재 <strong>카카오톡 인앱 브라우저</strong>로 접속 중입니다. 구글 정책상 인앱 로그인 정보가 차단되므로,{" "}
                <span className="text-rose-600 font-semibold underline">
                  {isIOS 
                    ? "우측 하단의 [···] 버튼을 누른 뒷 [Safari로 열기] 또는 [다른 브라우저로 열기]" 
                    : "우측 상단의 점 3개 버튼을 누른 뒤 [다른 브라우저로 열기]"}
                </span>
                를 선택하여 원활하게 사용해 주세요!
              </>
            ) : browserType === "instagram" ? (
              <>
                현재 <strong>인스타그램 인앱 웹뷰</strong>로 접속 중입니다. 구글 연동 및 상담 신청을 위해{" "}
                <span className="text-rose-600 font-semibold underline">
                  {isIOS 
                    ? "우측 상단의 점 3개 버튼 […] 을 누르고 [Magic Safari로 열기] 또는 [Safari에서 열기]" 
                    : "우측 상단의 점 3개 버튼을 누르고 [다른 브라우저로 열기]"}
                </span>
                를 선택하여 접속해 주세요!
              </>
            ) : (
              <>
                인앱 브라우저(페이스북/네이버/라인 등)에서는 구글 로그인이 차단될 수 있습니다. 원활한 이용을 위해{" "}
                <span className="text-rose-600 font-semibold underline">
                  우측 하단 또는 상단의 메뉴 버튼을 눌러 [Safari에서 열기] 혹은 [기본 브라우저로 열기]
                </span>
                를 권장합니다.
              </>
            )}
          </p>
        </div>

        <button 
          onClick={handleDismiss}
          className="absolute -top-1 -right-1 p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-rose-100/50 transition-colors"
          aria-label="안내 닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
