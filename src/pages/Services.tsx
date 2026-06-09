import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, CheckCircle2, Users, Video, Plane, FileText, Languages, Search, Bell, MessageSquareHeart, UserCheck, ClipboardCheck, X, ChevronRight, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

import BrandedHeart from "../components/BrandedHeart";
import { useKakaoLink } from "../components/useKakaoLink";

const JAPAN_STEPS = [
  {
    id: "01",
    title: "신청자와 대면상담",
    desc: "대면 상담을 통하여 머릿속으로만 생각하고 계시는 일본 여성과의 매칭을 구체화합니다. 지원 이유, 평소 연애관, 일본 여성에 대한 이미지, 결혼 이후 현실적인 문제 파악 등을 통해 적합성을 판단합니다.",
    icon: <Users className="w-6 h-6" />,
    details: ["1:1 심층 대면 상담", "연애관 및 가치관 파악", "미팅 적합성 공동 판단"]
  },
  {
    id: "02",
    title: "매칭준비",
    desc: "프로필 촬영 일정 잡기 및 필수 서류 6가지를 제출합니다. 별도의 웨딩숍에서 메이크업과 헤어를 마친 후 전문 스튜디오에서 촬영을 진행합니다. (별도비용 30만원)",
    icon: <FileText className="w-6 h-6" />,
    details: ["전문 프로필 촬영 지원", "6가지 필수 서류 제출", "신원 인증 및 검증"]
  },
  {
    id: "03",
    title: "계약 / IBJ, TMS 등록 및 자체매칭 참가",
    desc: "계약 체결 후 모든 서류를 일본어로 번역하여 일본 최대 결혼연합회인 IBJ, TMS에 등록합니다. 약 23만 명의 회원이 활동하는 시스템에서 성혼 활동이 시작됩니다.",
    icon: <ClipboardCheck className="w-6 h-6" />,
    details: ["IBJ/TMS 서류 심사 및 등록", "사이트 ID/PW 부여", "계약일로부터 1년 활동"],
    hasDetailedProcess: true
  },
  {
    id: "04",
    title: "성혼을 위한 프로필 서칭 과정",
    desc: "일본 현지 매니저가 시스템 사용을 도와드리며, 한 달에 약 200명 정도를 검색하여 마음에 드는 상대에게 DM 발송이 가능합니다. 인연애 자체 미팅 참여도 동시에 진행됩니다.",
    icon: <Search className="w-6 h-6" />,
    details: ["월 200명 검색 및 DM", "매니저 간 상호 검증", "객관적 회원 관리 시스템"],
    hasProfileSearch: true
  },
  {
    id: "05",
    title: "화상 미팅 매칭 통보",
    desc: "직접 서칭한 프로필이나 매니저 추천 상대에게 호감을 표시하면 상대 담당 매니저에게 의사가 전달됩니다. 상대가 수락 시 화상 매칭 성사를 통보해 드립니다.",
    icon: <Bell className="w-6 h-6" />,
    details: ["호감 의사 전달 서비스", "상대 수락 여부 확인", "매칭 성사 즉시 통보"],
    hasMatchNotification: true
  },
  {
    id: "06",
    title: "화상 미팅",
    desc: "양측의 수락으로 매칭 성사 시 화상 미팅을 진행합니다. 가급적 전용 조명과 설비가 구비된 '첫올' 인천 사무소 방문을 권장하며, 상황에 따라 개별 장소에서도 가능합니다.",
    icon: <Video className="w-6 h-6" />,
    details: ["전문 통역사 실시간 지원", "전용 방송 설비 이용 권장", "조명 및 환경 최적화"]
  },
  {
    id: "07",
    title: "가교제 시작",
    desc: "화상 미팅 후 서로에게 호감이 생겨 만남의 의지가 있다면 1개월간의 가교제 기간이 시작됩니다. SNS나 영상 통화를 통해 수시로 연락하며 서로의 마음을 알아갑니다.",
    icon: <MessageSquareHeart className="w-6 h-6" />,
    details: ["1개월 집중 교류 기간", "SNS 및 영상통화 소통", "현지 만남 의사 확인"]
  },
  {
    id: "08",
    title: "일본 현지 만남",
    desc: "현지 매니저가 전체 일정, 가이드, 비용 계획 및 예약을 대행합니다. 공항 픽업부터 가이드, 통역까지 매니저가 동행하며, 2일차부터는 상대분과 1:1 동행을 권유드립니다.",
    icon: <Plane className="w-6 h-6" />,
    details: ["공항 픽업 및 전일정 케어", "현지 매니저 밀착 동행", "1:1 자유 데이트 지원"]
  },
  {
    id: "09",
    title: "최종 선택",
    desc: "현지 매칭 후 최소 1개월 이상 호감을 가지고 연락을 유지하면 성혼 가능성이 높다고 판단합니다. 최종 선택 시 성혼으로 간주하며 계약이 성공적으로 종료됩니다.",
    icon: <UserCheck className="w-6 h-6" />,
    details: ["최종 성혼 의사 결정", "성혼 시 계약 종료 통보", "아름다운 결실 및 탈퇴"]
  }
];

const UZBEK_STEPS = [
  {
    id: "01",
    title: "신청자와 대면상담",
    desc: "화상 및 SNS 상담이 아닌 대면 상담을 통해 신청자의 우즈벡 결혼에 대한 확고한 의사를 확인하고, 머릿속에만 그려져 있는 본미팅을 구체화 시키는 단계입니다.",
    icon: <Users className="w-6 h-6" />,
    details: ["대면 심층 상담", "진정성 및 의사 확인", "본미팅 구체화"]
  },
  {
    id: "02",
    title: "계약",
    desc: "신청자와의 대면상담을 통해 신청자가 계약결정을 하시게 되면 정식 계약을 체결하게 됩니다.",
    icon: <ClipboardCheck className="w-6 h-6" />,
    details: ["정식 계약 체결", "계약 결정", "절차 안내"]
  },
  {
    id: "03",
    title: "매칭준비 활동",
    desc: "필수 서류 6가지 제출, 프로필 사진 촬영 및 작성을 진행합니다. 선택사항으로 현지 여성분들을 1차 필터링한 후 화상미팅을 진행할 수 있습니다.",
    icon: <FileText className="w-6 h-6" />,
    details: ["6가지 필수 서류 제출", "프로필 촬영 및 작성", "화상미팅 (선택)"]
  },
  {
    id: "04",
    title: "우즈베키스탄 현지 만남",
    desc: "계약 후 1~2개월 내 현지로 오셔서 2일에 걸쳐 일반지원자, 결정사 지원자들과 맞선을 보시는 일정입니다. 공항 픽업부터 모든 일정에 담당 매니저가 전 일정 동행을 합니다.",
    icon: <Plane className="w-6 h-6" />,
    details: ["현지 맞선 일정", "부모님 혼인가능 여부 확인", "전 일정 매니저 동행"]
  },
  {
    id: "05",
    title: "최종 선택 및 혼인신고 기타행사",
    desc: "2일에 걸쳐 맞선을 보시고 상호 수락 시 결혼을 위한 서류작업을 바로 시작합니다. 여성은 한국어시험준비를 하고, 그외 기타 행사들은 계약자분과 날짜를 협의해 진행합니다.",
    icon: <BrandedHeart className="w-6 h-6" />,
    details: ["최종 상호 수락", "서류 작업 즉시 시작", "한국어 교육 지원"]
  }
];

const REQUIRED_DOCUMENTS = [
  "01 혼인관계증명서 (상세)",
  "02 재직증명서 or 사업자등록증",
  "03 소득증명원",
  "04 건강진단서 (국제결혼용)",
  "05 범죄사실증명원 (관할 경찰서 민원실)",
  "06 여권사본 (사진면) 1부"
];

const PROFILE_DETAILS = [
  {
    title: "프로필 사진촬영",
    desc: "(현지에 가서 여성을 써칭하고 저희가 여성을 1차 인터뷰할때 필요합니다.)"
  },
  {
    title: "프로필 작성",
    desc: "본인을 충분히 알릴수있는 개성있는 프로필 작성, 이를바탕으로 매니저가 현지에서 여성을 모집하는데 활용합니다.\n(이름,나이,하시는일,년수입,사시는곳,취미, 내가 바라는 결혼 생활순으로 작성합니다.)"
  }
];

const VIDEO_MEETING_DETAILS = {
  title: "화상미팅 (선택)",
  desc: "기본적으로 저희가 먼저들어가 여성분들을 최소 5배수이상 만나 1차필터링 인터뷰를 하고 현지에서만 소개해드리는것을 원칙으로 합니다.\n(화상미팅 요청은 STANDARD/PREMIUM/VIP 에 따라 횟수 차이가 있습니다.) -> *미팅종류 안내에서 확인"
};

const REGISTRATION_WORKFLOW = [
  {
    title: "대면상담 & 필수 서류 제출 (등기로만)",
    desc: "서류의 위변조 방지 및 안전성 검증을 위해 대면 상담 후 필수 학력, 재직, 혼인 관계 서류 등을 반드시 오프라인 등기로 제출받고 있습니다.",
    badge: "오프라인 필수"
  },
  {
    title: "계약서 발송",
    desc: "공정거래위원회 표준 약관에 근거한 투명한 성혼 지원 계약서를 정식 발송하며, 상호 일체의 의구 없이 안심하고 진행하실 수 있는 관계를 성립합니다.",
    badge: "표준 계약"
  },
  {
    title: "계약금 납부",
    desc: "정식 계약 체결에 따른 가입비 및 기본 등록금 납부 처리가 진행되며, 투명한 영수 및 세액 처리가 신속하게 완료됩니다.",
    badge: "안전 납부"
  },
  {
    title: "모든 서류의 일본어 번역 후 IBJ, TMS에 등록",
    desc: "각 분야의 전문 번역가들이 직접 제출된 국문 서류를 전량 일본어로 교차 번역 및 공증하며, 일본 공식 매칭 시스템인 IBJ(일본결혼상담소연합회) 및 TMS 플랫폼에 정식으로 업로드 등록합니다.",
    badge: "번역 공증"
  },
  {
    title: "IBJ, TMS 서류심사",
    sub: "(*특이사항이 없는 한 2, 3일 내에 모든 승인 완료)",
    desc: "일본 측 사법 서류 검토반의 세심한 최종 심사망을 거치며, 기재의 위화감이나 미비 사항이 없을 시 영업일 기준 보통 2~3일 이내에 활동 승인이 완료됩니다.",
    badge: "안심 승인"
  },
  {
    title: "신청자에게 IBJ, TMS 사이트 ID, PW 부여",
    desc: "심사가 승인되는 즉시 개인용 계정(ID, PW)이 정식 발급되어 모바일 또는 PC로 일본 거주 및 활동 중인 전체 엘리트 회원의 실시간 상세 프로필에 자유롭게 액세스하실 수 있습니다.",
    badge: "전용 계정"
  },
  {
    title: "IBJ, TMS + 인연애미팅으로 성혼 활동 시작",
    sub: "(*이때부터 계약기간 1년이 산정됨)",
    desc: "공식 시스템 아이디가 생성·부여된 본격적인 해당 일자를 기점으로 1년의 보상 및 활동 기간이 공정하게 시작됩니다. 밀착 상담 서비스와 자체 온오프라인 미팅이 동시에 열립니다.",
    badge: "성혼 활동"
  }
];

const REAL_MEMBER_DATA = [
  { id: "F124946", age: "34세", location: "구마모토현", job: "간호사", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200" },
  { id: "F128820", age: "31세", location: "가나가와현", job: "치과 의사", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200" },
  { id: "F134748", age: "43세", location: "도쿄도", job: "경영자 · 회사 임원", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200" },
  { id: "F131981", age: "33세", location: "도쿄도", job: "간호사", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200" },
  { id: "F133454", age: "38세", location: "아이치현", job: "약사", image: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200" },
  { id: "F132850", age: "34세", location: "가나가와현", job: "사무 · 관리계 직종", image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=200" },
  { id: "F126361", age: "37세", location: "도쿄도", job: "직장인 (기타)", image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200" },
  { id: "F113610", age: "26세", location: "도쿄도", job: "각종 컨설턴트", image: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=200" },
  { id: "F127131", age: "29세", location: "가가와현", job: "사무 · 관리계 직종", image: "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=200" },
  { id: "F127449", age: "36세", location: "사이타마현", job: "개호 · 복지 관련직", image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=200" },
  { id: "F125433", age: "41세", location: "오키나와현", job: "경영자 · 회사 임원", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200" },
  { id: "F102766", age: "32세", location: "도쿄도", job: "의사", image: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=200" }
];

const REAL_MATCH_DATA = [
  { 
    requestDate: "02/09", 
    id: "F116511", 
    age: "31세", 
    location: "가고시마현", 
    job: "간호사", 
    matchDate: "03/01", 
    status: "사전 교제", 
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=260" 
  },
  { 
    requestDate: "02/06", 
    id: "F121268", 
    age: "36세", 
    location: "도쿄도", 
    job: "사무 · 관리계 직종", 
    matchDate: "03/16", 
    status: "사전 교제", 
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=260" 
  },
  { 
    requestDate: "02/05", 
    id: "F089832", 
    age: "32세", 
    location: "오사카부", 
    job: "영업 · 기획계 직종", 
    matchDate: "02/06", 
    status: "일치 일정 확정", 
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=260" 
  },
  { 
    requestDate: "02/02", 
    id: "F117684", 
    age: "33세", 
    location: "가나가와현", 
    job: "간호사", 
    matchDate: "02/17", 
    status: "사전 교제", 
    image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=260" 
  },
  { 
    requestDate: "01/17", 
    id: "F096053", 
    age: "29세", 
    location: "도쿄도", 
    job: "영업 · 기획계 직종", 
    matchDate: "02/09", 
    status: "사전 교제", 
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=260" 
  },
  { 
    requestDate: "01/16", 
    id: "F117155", 
    age: "35세", 
    location: "히로시마현", 
    job: "영업 · 기획계 직종", 
    matchDate: "02/02", 
    status: "사전 교제", 
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=260" 
  }
];

export default function Services() {
  const { openKakaoChat } = useKakaoLink();
  const [activeTab, setActiveTab] = useState<"japan" | "uzbekistan">("japan");
  const [hoveredDetail, setHoveredDetail] = useState<string | null>(null);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [isProfileSearchOpen, setIsProfileSearchOpen] = useState(false);
  const [isMatchNotificationOpen, setIsMatchNotificationOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setIsAdmin(u ? u.email === "wootaengboy@gmail.com" : false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin && activeTab === "uzbekistan") {
      setActiveTab("japan");
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    const anyOpen = isWorkflowOpen || isProfileSearchOpen || isMatchNotificationOpen;
    if (anyOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isWorkflowOpen, isProfileSearchOpen, isMatchNotificationOpen]);

  return (
    <div className="pt-24 pb-24 px-6 md:px-[5%] max-w-7xl mx-auto min-h-screen relative">
      {/* Background Decorations */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-pink/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-accent-pink/5 blur-[100px] rounded-full -z-10" />

      {/* Header Section */}
      <div className="mb-24 text-center">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-sans font-bold text-accent-pink uppercase tracking-[0.5em] mb-6 block"
        >
          Our Methodology
        </motion.span>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-8xl font-serif mb-8 tracking-tighter leading-[1.1] md:leading-tight break-keep"
        >
          Matching <br />
          <span className="text-gray-600 italic">Process</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-500 max-w-2xl mx-auto font-sans font-light leading-relaxed"
        >
          투명하고 체계적인 프로세스를 통해 당신의 소중한 인연을 찾아드립니다. <br />
          국가별 특성에 최적화된 맞춤형 여정을 확인해보세요.
        </motion.p>
      </div>

      {/* Tab Switcher */}
      {isAdmin && (
        <div className="flex justify-center mb-24">
          <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-full border border-gray-200/50 shadow-sm flex gap-2">
            <button
              onClick={() => setActiveTab("japan")}
              className={`px-10 py-3.5 rounded-full text-xs font-sans font-bold uppercase tracking-widest transition-all duration-500 flex items-center gap-2 ${
                activeTab === "japan" 
                  ? "bg-white text-[#BC002D] shadow-[0_10px_25px_rgba(188,0,45,0.15)] border border-[#BC002D]/20" 
                  : "text-gray-400 hover:text-gray-900"
              }`}
            >
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${activeTab === "japan" ? "bg-[#BC002D] scale-125" : "bg-gray-300"}`} />
              Japan
            </button>
            <button
              onClick={() => setActiveTab("uzbekistan")}
              className={`px-10 py-3.5 rounded-full text-xs font-sans font-bold uppercase tracking-widest transition-all duration-500 flex items-center gap-2 ${
                activeTab === "uzbekistan" 
                  ? "bg-[#0099B5] text-white shadow-[0_10px_25px_rgba(0,153,181,0.25)]" 
                  : "text-gray-400 hover:text-gray-900"
              }`}
            >
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${activeTab === "uzbekistan" ? "bg-white scale-125 shadow-[0_0_5px_rgba(255,255,255,0.5)]" : "bg-gray-300"}`} />
              Uzbekistan
            </button>
          </div>
        </div>
      )}

      {/* Process Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          {(activeTab === "japan" ? JAPAN_STEPS : UZBEK_STEPS).map((step, idx) => {
            const isInteractiveStep = (step as any).hasDetailedProcess || (step as any).hasProfileSearch || (step as any).hasMatchNotification;
            return (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('.cursor-help') || target.closest('button') || target.closest('a')) {
                    return;
                  }
                  if (isInteractiveStep) {
                    if ((step as any).hasDetailedProcess) {
                      setIsWorkflowOpen(true);
                    } else if ((step as any).hasProfileSearch) {
                      setIsProfileSearchOpen(true);
                    } else if ((step as any).hasMatchNotification) {
                      setIsMatchNotificationOpen(true);
                    }
                  }
                }}
                className={`bg-white/40 backdrop-blur-md rounded-[3rem] p-10 md:p-16 border shadow-sm flex flex-col md:flex-row gap-16 items-start group hover:bg-white transition-all duration-700 hover:shadow-2xl hover:shadow-accent-pink/5 relative z-10 hover:z-30 ${
                  isInteractiveStep ? "cursor-pointer hover:border-accent-pink/40 border-gray-100" : "border-white"
                }`}
              >
                <div className="flex flex-col items-center gap-6 shrink-0">
                  <span className="text-6xl font-serif text-gray-500 group-hover:text-accent-pink/60 transition-colors duration-700 leading-none">
                    {step.id}
                  </span>
                  <div className={`w-16 h-16 rounded-3xl bg-white shadow-inner flex items-center justify-center text-gray-900 group-hover:bg-accent-pink group-hover:text-white group-hover:scale-110 transition-all duration-700 ${
                    isInteractiveStep ? "border border-accent-pink/10" : ""
                  }`}>
                    {step.icon}
                  </div>
                </div>
                
                <div className="flex-grow">
                  <h3 className="text-3xl md:text-4xl font-serif mb-6 tracking-tight leading-snug break-keep flex items-center gap-3">
                    {step.title}
                    {isInteractiveStep && (
                      <span className="inline-block text-[10px] font-sans font-bold bg-accent-pink/10 text-accent-pink px-3 py-1 rounded-full uppercase tracking-wider relative -top-0.5 animate-pulse">
                        Interactive
                      </span>
                    )}
                  </h3>
                  <p className="text-lg text-gray-500 font-sans font-light leading-relaxed max-w-2xl mb-10">
                    {step.desc}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {step.details.map((detail, dIdx) => {
                      const isHoverableDetail = (activeTab === "japan" && step.id === "02" && detail === "6가지 필수 서류 제출") ||
                                        (activeTab === "uzbekistan" && step.id === "03" && (detail === "6가지 필수 서류 제출" || detail === "프로필 촬영 및 작성" || detail === "화상미팅 (선택)"));
                      return (
                        <div 
                          key={dIdx} 
                          className={`relative ${isHoverableDetail && hoveredDetail === detail ? 'z-50' : 'z-0'}`}
                          onMouseEnter={() => isHoverableDetail && setHoveredDetail(detail)}
                          onMouseLeave={() => isHoverableDetail && setHoveredDetail(null)}
                        >
                          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50/80 border border-gray-100 text-[13px] text-gray-900 font-sans font-normal uppercase tracking-[0.1em] transition-all duration-300 ${isHoverableDetail ? 'cursor-help hover:bg-white hover:border-accent-pink/30 hover:text-accent-pink hover:shadow-md' : ''}`}>
                            <div className={`w-1.5 h-1.5 rounded-full bg-accent-pink transition-all duration-300 ${isHoverableDetail && hoveredDetail === detail ? 'scale-150 shadow-[0_0_10px_rgba(255,77,148,0.5)]' : 'opacity-40'}`} />
                            {detail}
                          </div>

                          {isHoverableDetail && (
                            <AnimatePresence>
                              {hoveredDetail === detail && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  className="absolute top-full left-0 mt-4 w-[320px] bg-white p-8 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 z-[100] pointer-events-none"
                                >
                                  {detail === "6가지 필수 서류 제출" && (
                                    <>
                                      <div className="text-[10px] font-sans font-bold text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5 text-accent-pink" /> 필수 서류 리스트
                                      </div>
                                      <div className="space-y-4">
                                        {REQUIRED_DOCUMENTS.map((doc, i) => (
                                          <div key={i} className="text-[11px] text-gray-500 font-sans flex items-start gap-3 leading-tight">
                                            <span className="text-accent-pink font-serif italic font-bold shrink-0">{doc.slice(0, 2)}</span>
                                            <span className="group-hover:text-gray-900 transition-colors">{doc.slice(3)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  )}

                                  {detail === "프로필 촬영 및 작성" && (
                                    <>
                                      <div className="text-[10px] font-sans font-bold text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                                        <Search className="w-3.5 h-3.5 text-accent-pink" /> 프로필 상세 안내
                                      </div>
                                      <div className="space-y-6">
                                        {PROFILE_DETAILS.map((item, i) => (
                                          <div key={i} className="space-y-2">
                                            <div className="text-[11px] text-accent-pink font-bold flex items-center gap-2">
                                              <div className="w-1 h-1 rounded-full bg-accent-pink" />
                                              {item.title}
                                            </div>
                                            <div className="text-[11px] text-gray-500 font-sans leading-relaxed whitespace-pre-line">
                                              {item.desc}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  )}

                                  {detail === "화상미팅 (선택)" && (
                                    <>
                                      <div className="text-[10px] font-sans font-bold text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                                        <Video className="w-3.5 h-3.5 text-accent-pink" /> 화상미팅 안내
                                      </div>
                                      <div className="space-y-4">
                                        <div className="text-[11px] text-accent-pink font-bold flex items-center gap-2">
                                          <div className="w-1 h-1 rounded-full bg-accent-pink" />
                                          {VIDEO_MEETING_DETAILS.title}
                                        </div>
                                        <div className="text-[11px] text-gray-500 font-sans leading-relaxed whitespace-pre-line">
                                          {VIDEO_MEETING_DETAILS.desc}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="hidden md:block shrink-0">
                  <button 
                    onClick={() => {
                      if ((step as any).hasDetailedProcess) {
                        setIsWorkflowOpen(true);
                      } else if ((step as any).hasProfileSearch) {
                        setIsProfileSearchOpen(true);
                      } else if ((step as any).hasMatchNotification) {
                        setIsMatchNotificationOpen(true);
                      }
                    }}
                    className={`w-14 h-14 rounded-full border border-gray-100 flex items-center justify-center transition-all duration-700 ${
                      isInteractiveStep 
                        ? "bg-accent-pink text-white border-accent-pink hover:scale-110 hover:shadow-lg hover:shadow-accent-pink/20" 
                        : "group-hover:bg-black group-hover:text-white group-hover:rotate-45"
                    }`}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* CTA Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-32 bg-gradient-to-br from-accent-pink/5 to-accent-pink/10 text-gray-900 p-16 md:p-24 rounded-[4rem] text-center relative overflow-hidden border border-accent-pink/20 shadow-2xl shadow-accent-pink/5"
      >
        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-serif mb-8 leading-[1.1] md:leading-tight break-keep">Ready to Start?</h2>
          <p className="text-gray-500 max-w-xl mx-auto font-sans font-light mb-12">
            당신만의 특별한 인연을 찾는 여정,<br />지금 바로 시작하세요.<br />
            전문 매니저가 당신의 모든 과정을 함께합니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/contact"
              className="w-full sm:w-auto text-center bg-black text-white px-6 sm:px-12 py-4 sm:py-5 rounded-full font-sans font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-lg shadow-black/20 whitespace-nowrap"
            >
              상담 신청하기
            </Link>
            <button 
              onClick={openKakaoChat}
              className="w-full sm:w-auto bg-[#FAE100] text-[#3C1E1E] px-6 sm:px-12 py-4 sm:py-5 rounded-full font-sans font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-lg shadow-[#FAE100]/20 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              실시간 상담
            </button>
            <Link 
              to={activeTab === "japan" ? "/services/japan" : "/services/uzbekistan"}
              className="w-full sm:w-auto text-center bg-white text-gray-900 border border-gray-200 px-6 sm:px-12 py-4 sm:py-5 rounded-full font-sans font-bold uppercase tracking-widest text-sm hover:bg-gray-50 transition-all whitespace-nowrap"
            >
              패키지 확인하기
            </Link>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-pink/5 blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-pink/5 blur-[120px] -ml-48 -mb-48" />
      </motion.div>

      {/* Registration Workflow Modal */}
      <AnimatePresence>
        {isWorkflowOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWorkflowOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md hidden sm:block"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl bg-[#FAF9F5] rounded-none sm:rounded-[2.5rem] md:rounded-[3.5rem] p-5 pt-14 pb-12 sm:p-10 md:p-16 shadow-2xl overflow-y-auto overflow-x-hidden z-10 border-0 sm:border border-gray-100 no-scrollbar"
            >
              <button 
                onClick={() => setIsWorkflowOpen(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white border border-gray-200/50 flex items-center justify-center hover:bg-gray-50 hover:text-accent-pink shadow-sm transition-all text-gray-400 z-50 animate-fade-in"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-10 text-left pt-6 sm:pt-4 md:pt-0">
                <span className="text-[10px] font-sans font-bold text-accent-pink uppercase tracking-[0.5em] mb-2.5 block">
                  REGISTRATION WORKFLOW
                </span>
                <h2 className="text-lg xs:text-xl sm:text-2xl md:text-4xl font-serif tracking-tight leading-snug break-keep text-gray-900">
                  계약 및 시스템 등록 <span className="text-accent-pink italic">상세 과정</span>
                </h2>
                <p className="text-xs text-gray-500 font-sans mt-2 leading-relaxed max-w-lg">
                  첫올의 안전하고 검증된 가입 심사망 등록 및 성혼 활동 기점까지의 정밀 프로토콜입니다.
                </p>
              </div>

              {/* Vertical Timeline implementation */}
              <div className="relative ml-2 sm:ml-4 pl-6 sm:pl-10 border-l-2 border-dashed border-[#E07A5F]/20 space-y-8 py-2">
                {REGISTRATION_WORKFLOW.map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative group"
                  >
                    {/* Timeline vertical node */}
                    <div className="absolute -left-[31px] sm:-left-[47px] top-2 w-4 h-4 rounded-full bg-[#FAF9F5] border-2 border-[#E07A5F] flex items-center justify-center group-hover:scale-125 group-hover:bg-[#E07A5F] transition-all duration-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E07A5F] group-hover:bg-white transition-colors" />
                    </div>

                    <div className="bg-white border border-[#F2EDE4]/80 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-[0_4px_22px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_-6px_rgba(224,122,95,0.08)] hover:border-accent-pink/30 hover:-translate-y-0.5 transition-all duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                        <span className="text-[10px] sm:text-xs font-sans font-black text-[#E07A5F] tracking-widest uppercase bg-rose-50/50 px-3 py-1 rounded-full border border-rose-100/30 w-fit">
                          STEP 0{idx + 1}
                        </span>
                        {item.badge && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-accent-pink bg-accent-pink/5 border border-accent-pink/15 rounded-full px-2.5 py-0.5 w-fit">
                            <Sparkles className="w-3 h-3 text-accent-pink" /> {item.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base md:text-lg font-serif font-black text-gray-900 tracking-tight leading-snug">
                        {item.title}
                      </h3>

                      {item.sub && (
                        <div className="mt-2 inline-block text-xs font-sans font-bold text-[#E07A5F] bg-rose-50/70 px-3 py-1 rounded-lg border border-rose-100/40">
                          {item.sub}
                        </div>
                      )}

                      <p className="mt-3 text-xs md:text-sm text-gray-600 font-sans leading-relaxed break-keep">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Verified Badge and Controls */}
              <div className="mt-12 pt-8 border-t border-gray-200/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 bg-[#FAF4ED] border border-[#F2EDE4] rounded-2xl sm:rounded-full px-4.5 py-3 w-full sm:w-auto text-left">
                  <ShieldCheck className="w-5 h-5 text-accent-pink flex-shrink-0" />
                  <p className="text-[10px] sm:text-xs text-gray-800 font-sans font-bold tracking-wide">
                    일본결혼연합회 정식 가입사 전체회원수 약 <span className="text-accent-pink text-xs sm:text-sm font-extrabold">23만명</span> (24년 기준)
                  </p>
                </div>
                <button 
                  onClick={() => setIsWorkflowOpen(false)}
                  className="w-full sm:w-auto bg-black text-white hover:bg-accent-pink hover:text-gray-900 transition-colors px-10 py-4 rounded-full text-xs font-sans font-bold uppercase tracking-widest hover:scale-102 hover:-translate-y-0.5 transition-all duration-300 shadow-md shadow-black/10 active:scale-98"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Search Popup Modal */}
      <AnimatePresence>
        {isProfileSearchOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileSearchOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-5xl bg-[#FAF9F5] rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh] z-10 border border-gray-100 no-scrollbar"
            >
              {/* Floating close button */}
              <button 
                onClick={() => setIsProfileSearchOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white border border-gray-200/50 flex items-center justify-center hover:bg-gray-50 hover:text-accent-pink shadow-sm transition-all text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8 text-left">
                <span className="text-[10px] font-sans font-bold text-accent-pink uppercase tracking-[0.5em] mb-2 block animate-pulse">
                  04 PROFILE SEARCHING PROCESS
                </span>
                <h2 className="text-3xl md:text-4xl font-serif tracking-tight leading-snug break-keep text-gray-900">
                  성혼을 위한 <span className="text-accent-pink italic">프로필 서칭 과정</span> 예시
                </h2>
                <p className="text-xs text-gray-500 font-sans mt-2 leading-relaxed max-w-xl">
                  일본 최대 결혼 연합회(IBJ / TMS) 정보망을 활용하여, 회원님의 가치관과 선호 구역, 연봉 및 세부 요청에 맞는 신규 활동 회원들의 리스트를 서칭하는 실제 현황입니다. 개인정보 보호를 위해 사진은 모자이크/블러 처리되어 제공됩니다.
                </p>
              </div>

              {/* Real table emulation block */}
              <div className="relative z-10 overflow-hidden">
                <div className="border border-gray-300 rounded-2xl overflow-hidden shadow-xl bg-white">
                  {/* Green bar header */}
                  <div className="bg-white border-b-[3px] border-[#5EBA93] px-6 py-4 flex justify-between items-center">
                    <span className="text-sm md:text-base font-bold text-gray-900 font-sans flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#5EBA93] animate-pulse" />
                      3/28(금)의 신규 회원
                    </span>
                    <button className="bg-[#5EBA93] text-white hover:bg-[#4ea27d] px-4 py-1.5 font-sans font-bold text-[11px] md:text-xs flex items-center gap-1 rounded transition-all shadow-sm">
                      더 보기 ≫
                    </button>
                  </div>
                  
                  {/* The Grid Table */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-gray-200 gap-px">
                    {REAL_MEMBER_DATA.map((member, mIdx) => (
                      <div key={mIdx} className="bg-white p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-all duration-300 group">
                        {/* Left: Avatar with blurred/mosaic filter */}
                        <div className="w-20 h-24 overflow-hidden relative shrink-0 border border-gray-100 bg-gray-50 flex items-center justify-center select-none shadow-inner rounded-md">
                          <img 
                            src={member.image} 
                            alt="Search Profile Member" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover filter blur-[10px] scale-110 pointer-events-none select-none transition-all duration-500 group-hover:blur-[12px]" 
                          />
                          <div className="absolute inset-0 bg-black/5 flex items-center justify-center select-none">
                            <span className="text-[8px] font-sans font-bold text-white bg-black/40 px-1 py-0.5 rounded tracking-wider scale-90">MOSAIC</span>
                          </div>
                        </div>
                        
                        {/* Right: Info */}
                        <div className="text-left font-sans flex-grow min-w-0">
                          <div className="text-[#3b5998] hover:text-accent-pink font-mono font-bold text-[13px] tracking-wide leading-tight hover:underline cursor-pointer truncate">
                            {member.id}
                          </div>
                          <div className="text-xs text-gray-800 font-medium mt-1 leading-normal truncate">
                            {member.age} {member.location}
                          </div>
                          <div className="text-[11px] text-gray-500 font-normal mt-1 leading-tight break-keep line-clamp-2">
                            {member.job}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Info Footer */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-[11px] text-gray-400 font-sans">
                  ※ 실시간 서칭 현황은 최신 매체 데이터와 100% 동기화되어 매월 업데이트됩니다.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsProfileSearchOpen(false)}
                    className="bg-gray-900 text-white font-sans font-bold duration-300 uppercase tracking-widest text-xs px-8 py-3.5 rounded-full hover:bg-black hover:shadow-lg hover:shadow-black/10 transition-all border border-gray-900"
                  >
                    확인 완료
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Match Notification Popup Modal */}
      <AnimatePresence>
        {isMatchNotificationOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMatchNotificationOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-5xl bg-[#FAF9F5] rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh] z-10 border border-gray-100 no-scrollbar"
            >
              {/* Floating close button */}
              <button 
                onClick={() => setIsMatchNotificationOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white border border-gray-200/50 flex items-center justify-center hover:bg-gray-50 hover:text-accent-pink shadow-sm transition-all text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8 text-left">
                <span className="text-[10px] font-sans font-bold text-accent-pink uppercase tracking-[0.5em] mb-2 block animate-pulse">
                  05 MATCH NOTIFICATION PROCESS
                </span>
                <h2 className="text-3xl md:text-4xl font-serif tracking-tight leading-snug break-keep text-gray-900">
                  화상 미팅 <span className="text-accent-pink italic">매칭 통보 현황</span> 예시
                </h2>
                <p className="text-xs text-gray-500 font-sans mt-2 leading-relaxed max-w-xl">
                  호감 표시를 주고받은 끝에 매니저 간 상호 연락과 매칭 조율이 완료된 매칭 대상 회원 현황판 예시입니다. 개인정보 보호를 위해 사진은 모자이크/블러 처리되어 표현됩니다.
                </p>
              </div>

              {/* Match Table Block */}
              <div className="relative z-10 overflow-hidden">
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xl bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] md:text-xs text-gray-500 uppercase tracking-wider">
                          <th className="px-6 py-4 text-center font-bold w-24">신청 일자</th>
                          <th className="px-6 py-4 font-bold pl-12">매칭 회원 정보</th>
                          <th className="px-6 py-4 text-center font-bold w-32">승인/확정 일자</th>
                          <th className="px-6 py-4 text-center font-bold w-40">상태 / 관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        {REAL_MATCH_DATA.map((match, mIdx) => (
                          <tr key={mIdx} className="hover:bg-gray-50/30 transition-colors">
                            {/* Request Date */}
                            <td className="px-6 py-6 text-center font-semibold text-gray-700 text-sm border-r border-gray-150">
                              {match.requestDate}
                            </td>
                            
                            {/* Member Informative Grid */}
                            <td className="px-6 py-4 border-r border-gray-150">
                              <div className="flex items-center gap-5 pl-4 md:pl-8">
                                {/* Blurred Avatar Picture with Mosaic overlay */}
                                <div className="w-16 h-20 overflow-hidden relative shrink-0 border border-gray-100 bg-gray-50 flex items-center justify-center select-none shadow-inner rounded-md">
                                  <img 
                                    src={match.image} 
                                    alt="Matching Member Profile" 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover filter blur-[12px] scale-110 pointer-events-none select-none transition-all duration-500 hover:blur-[14px]" 
                                  />
                                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center select-none">
                                    <span className="text-[7px] font-sans font-bold text-white bg-black/40 px-1 py-0.5 rounded tracking-wider scale-90">MOSAIC</span>
                                  </div>
                                </div>
                                
                                <div className="text-left min-w-0">
                                  <div className="text-[#3b5998] hover:text-accent-pink font-mono font-bold text-[13px] tracking-wide leading-tight hover:underline cursor-pointer">
                                    {match.id}
                                  </div>
                                  <div className="text-xs text-gray-800 font-medium mt-1">
                                    {match.age} {match.location}
                                  </div>
                                  <div className="text-[11px] text-gray-500 font-normal mt-0.5">
                                    {match.job}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            {/* Status/Confirmation Date */}
                            <td className="px-6 py-6 text-center text-gray-600 text-sm border-r border-gray-150 font-medium">
                              {match.matchDate}
                            </td>
                            
                            {/* Status and Action Buttons */}
                            <td className="px-6 py-6 text-center">
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                <span className="text-xs text-gray-900 font-bold tracking-tight">
                                  {match.status}
                                </span>
                                <button className="bg-[#5EBA93] hover:bg-[#4ea27d] text-white font-bold text-[11px] py-1.5 px-5 rounded transition-all duration-300 shadow-sm cursor-pointer border border-[#5EBA93]/10">
                                  일치 관리
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Info Footer */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-[11px] text-gray-400 font-sans">
                  ※ 매칭 완료 및 일정 정산 현황은 인연애 플랫폼 회원 관리 데이터베이스와 밀접하게 연동됩니다.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsMatchNotificationOpen(false)}
                    className="bg-gray-900 text-white font-sans font-bold duration-300 uppercase tracking-widest text-xs px-8 py-3.5 rounded-full hover:bg-black hover:shadow-lg hover:shadow-black/10 transition-all border border-gray-900"
                  >
                    확인 완료
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
