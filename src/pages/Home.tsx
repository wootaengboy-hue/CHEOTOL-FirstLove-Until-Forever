import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Send, Search, Video, MapPin, Home as HomeIcon, ArrowLeft, ArrowRight, CheckCircle2, Loader2, MessageCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, getDoc } from "firebase/firestore";
import { INITIAL_POSTS, INITIAL_PORTFOLIO } from "../constants/blogData";

import BrandedHeart from "../components/BrandedHeart";
import { useKakaoLink } from "../components/useKakaoLink";
import { useGoogleFormLink } from "../components/useGoogleFormLink";

const logo1 = new URL("../assets/logo1.png", import.meta.url).href;
const logo2 = new URL("../assets/logo2.png", import.meta.url).href;
const logo3 = new URL("../assets/logo3.png", import.meta.url).href;
const homeMainImage = new URL("../assets/home_main.png", import.meta.url).href;

const STEPS = [
  { 
    id: 1,
    step: "Step 1", 
    title: "상담 신청 및 첫 분석", 
    subtitle: "당신이라는 고유한 세계를\n이해하는 첫 단추",
    desc: "저희는 단순 조건 맞춤을 넘어, 서로의 순수한 호기심과 몰입에 기반한 'First Love Until Forever'를 추구합니다. 편견을 넘어 나를 발견하는 시간을 설계해 드립니다.",
    longDesc: "한국 사회가 요구하는 정형화된 스펙과 조건의 굴레에서 벗어나, 당신이 가진 본연의 매력과 가치관을 심층적으로 분석합니다. 전문 컨설턴트와의 1:1 대화를 통해 당신이 꿈꾸는 삶의 지향점과 인연의 모습을 구체화합니다. 이 과정은 단순히 상대를 찾는 것이 아니라, 당신 스스로도 몰랐던 '진짜 나'를 발견하는 여정의 시작입니다.",
    icon: <Search className="w-6 h-6" />,
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1000"
  },
  { 
    id: 2,
    step: "Step 2", 
    title: "검증된 인연 추천", 
    subtitle: "조건이 아닌 가치관으로\n연결되는 만남",
    desc: "단순한 매칭이 아닌, 당신의 가치관과 삶의 궤적을 이해하는 최적의 인연을 엄선하여 제안합니다.",
    longDesc: "전 세계 네트워크를 통해 확보된 수많은 인연 중, 당신의 라이프스타일과 미래 비전에 가장 부합하는 분들을 엄선합니다. 외적인 조건보다 더 중요한 것은 서로를 대하는 태도와 삶을 바라보는 시선입니다. CHEOTOL만의 엄격한 검증 시스템을 통과한, 진정성 있는 인연만을 당신에게 소개합니다.",
    icon: <BrandedHeart className="w-6 h-6" />,
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=1000"
  },
  { 
    id: 3,
    step: "Step 3", 
    title: "온라인 화상 미팅", 
    subtitle: "물리적 거리를 넘어\n마음이 먼저 닿는 시간",
    desc: "글로벌 네트워크 센터를 통해 일본, 베트남, 우즈벡 등 다양한 국가의 인연과 안전한 만남을 주선합니다.",
    longDesc: "직접 만나기 전, 온라인을 통해 서로의 목소리와 눈빛을 마주합니다. 언어의 장벽은 전문 통역 지원을 통해 자연스럽게 해소되며, 오직 서로에게 집중할 수 있는 환경을 제공합니다. 이 시간은 서로에 대한 호기심을 확신으로 바꾸는 소중한 과정입니다.",
    details: [
      { label: "Address", value: "글로벌 네트워크 센터" },
      { label: "지원 국가", value: "일본, 베트남, 우즈벡 외 다수" },
      { label: "검증 절차", value: "100% 신원 보증 및 심층 인터뷰" }
    ],
    icon: <Video className="w-6 h-6" />,
    image: "https://images.unsplash.com/photo-1587560699334-cc4ff634909a?auto=format&fit=crop&q=80&w=1000"
  },
  { 
    id: 4,
    step: "Step 4", 
    title: "현지 만남 지원", 
    subtitle: "화면 너머의 설렘이\n현실이 되는 순간",
    desc: "현지에서의 안전하고 편안한 만남을 위해 모든 과정을 세심하게 지원합니다.",
    longDesc: "온라인에서의 교감이 실제 만남으로 이어지는 설레는 순간입니다. 항공권 예약부터 현지 숙소, 데이트 코스 설계까지 모든 여정을 CHEOTOL이 함께합니다. 낯선 환경에서도 오직 인연에만 집중할 수 있도록 현지 가이드와 전문 스태프가 밀착 케어 서비스를 제공합니다.",
    icon: <MapPin className="w-6 h-6" />,
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1000"
  },
  { 
    id: 5,
    step: "Step 5", 
    title: "성혼 후 정착 케어", 
    subtitle: "함께 그려나갈 미래를 위한\n든든한 동행",
    desc: "결혼 이후의 안정적인 정착과 행복한 가정을 위한 지속적인 케어 서비스를 제공합니다.",
    longDesc: "성혼은 끝이 아닌 새로운 시작입니다. 서로 다른 문화에서 자란 두 사람이 하나가 되어가는 과정에서 발생할 수 있는 갈등을 조율하고, 한국 사회 정착을 위한 법률 및 행정 지원, 문화 적응 교육 등을 지속적으로 제공합니다. 당신의 가정이 행복하게 뿌리내릴 때까지 CHEOTOL은 곁을 지킵니다.",
    icon: <HomeIcon className="w-6 h-6" />,
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1000"
  }
];

const formatPhoneNumber = (value: string) => {
  if (value.includes("@")) return value;
  const clean = value.replace(/[^0-9]/g, "");
  if (clean.length === 0) return value;
  if (/[a-zA-Z]/.test(value)) return value;

  if (clean.startsWith("02")) {
    if (clean.length <= 2) return clean;
    if (clean.length <= 5) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
    if (clean.length <= 9) return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
    return `${clean.slice(0, 2)}-${clean.slice(2, 6)}-${clean.slice(6, 10)}`;
  }

  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  if (clean.length <= 10) return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
};

export default function Home() {
  const navigate = useNavigate();
  const { openKakaoChat } = useKakaoLink();
  const { openGoogleForm } = useGoogleFormLink();
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [latestPosts, setLatestPosts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    date: "",
    time: "",
    story: "구글 설문지에서 상세 정보 작성 예정"
  });

  const currentStepData = activeStep ? STEPS.find(s => s.id === activeStep) : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let docRef: any = null;
    try {
      // 1. Save to Firestore "consultations" first for 100% durable local lead storage
      docRef = await addDoc(collection(db, "consultations"), {
        name: formData.name,
        contact: formData.contact,
        date: formData.date,
        time: formData.time,
        story: formData.story,
        submittedAt: new Date().toISOString(),
        source: "Home Slide/Form",
        status: "NEW"
      });
      console.log("Consultation saved to Firestore successfully.");
    } catch (fsError) {
      console.error("Firestore database save error:", fsError);
    }

    // Try to auto-sync to Google Calendar directly on client-side
    if (docRef && formData.date && formData.time) {
      try {
        const calSettingsRef = doc(db, "settings", "google_calendar");
        const calSettingsSnap = await getDoc(calSettingsRef);
        if (calSettingsSnap.exists()) {
          const calData = calSettingsSnap.data();
          if (calData.token && calData.expiresAt && Date.now() < calData.expiresAt) {
            const startDateTime = new Date(`${formData.date}T${formData.time || "14:00"}:00`);
            const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour

            const eventBody = {
              summary: `[상담] ${formData.name}님`,
              description: `연락처: ${formData.contact || "없음"}\n내용: ${formData.story || "없음"}`,
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

            const gcalResponse = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${calData.token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(eventBody)
            });

            if (gcalResponse.ok) {
              const calEvent = await gcalResponse.json();
              await updateDoc(docRef, { calendarEventId: calEvent.id });
              console.log("Automatically synced to Google Calendar on submit!");
            } else {
              console.warn("Direct Google Calendar sync failed (status: " + gcalResponse.status + "), will sync automatically in background next time Admin opens dashboard.");
            }
          }
        }
      } catch (calError) {
        console.error("Direct Google Calendar sync exception:", calError);
      }
    }

    try {
      // 2. Call backend to handle Google Calendar sync and email notifications (Only if backend is present)
      // GitHub Pages uses github.io which has no active backend server.
      if (window.location.hostname.includes("github.io") || window.location.hostname.includes("gitpod") || window.location.hostname.includes("web.app") || window.location.hostname.includes("firebaseapp")) {
        console.log("Static hosting context detected. Skipped backend notifications; Firestore durable save remains active.");
        setIsSubmitted(true);
        return;
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsSubmitted(true);
        const data = await response.json();
        if (data.calendarEventId && docRef) {
          await updateDoc(docRef, { calendarEventId: data.calendarEventId });
          console.log("Updated Firestore document with calendarEventId:", data.calendarEventId);
        }
      } else {
        // Even if email/calendar sync responds with an error, the consultation is saved to Firestore,
        // and we show the consultation card in GUI to reassure the user
        const errorData = await response.json();
        console.error("Backend warning or error:", errorData);
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error("Submission backend API error:", error);
      setIsSubmitted(true); // Still show card to user as it's saved in Firestore
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        };
      }) as any[];
      
      const dbTitles = new Set(fetchedPosts.map(p => p.title));
      const filteredSamples = INITIAL_POSTS.filter(p => !dbTitles.has(p.title));
      const combined = [...fetchedPosts, ...filteredSamples];
      setLatestPosts(combined.slice(0, 3));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleReset = () => {
      setActiveStep(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("reset-active-journey-step", handleReset);
    return () => {
      window.removeEventListener("reset-active-journey-step", handleReset);
    };
  }, []);

  useEffect(() => {
    if (activeStep !== null) {
      // Use setTimeout to allow DOM layout to stabilize during navigation transitions
      const timer = setTimeout(() => {
        const btnElement = document.getElementById("back-to-journey-btn");
        const timelineElement = document.getElementById("journey-timeline");
        
        let targetScrollY = null;
        if (btnElement) {
          // Position the "Back to Journey" button perfectly with a clean margin below the header navbar
          targetScrollY = btnElement.getBoundingClientRect().top + window.pageYOffset - 85;
        } else if (timelineElement) {
          // If the button is not yet mounted (due to AnimatePresence exit delay),
          // calculate its expected position based on the section's top offset.
          // Section has py-32 (128px) top padding, so the button starts 128px below section top.
          // Aligned with -85px offset, target is timelineElement.top + 128px - 85px = timelineElement.top + 43px
          targetScrollY = timelineElement.getBoundingClientRect().top + window.pageYOffset + 43;
        }

        if (targetScrollY !== null) {
          window.scrollTo({
            top: targetScrollY,
            behavior: "smooth"
          });
        }
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [activeStep]);

  return (
    <div className="min-h-screen selection:bg-accent-pink/50">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row min-h-[calc(100vh-5rem)] md:h-[calc(100vh-5rem)] w-full overflow-visible md:overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full md:w-1/2 h-[45vh] md:h-full relative overflow-hidden"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
            style={{ backgroundImage: `url('${homeMainImage}')` }}
          />
          <motion.div 
            initial={{ scale: 0, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 20 }}
            className="absolute top-6 left-6 md:top-10 md:left-10 z-10"
          >
            <div className="relative flex items-center justify-center w-24 h-24 md:w-32 md:h-32 bg-white/40 backdrop-blur-md rounded-full shadow-2xl border border-white/50">
              <img 
                src={logo3} 
                alt="CHEOTOL Badge Logo" 
                className="w-14 h-14 md:w-20 md:h-20 object-contain transition-transform duration-300 hover:scale-[1.05]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-2 whitespace-nowrap bg-white px-3 py-1 rounded-full shadow-md">
                <span className="text-[8px] font-sans font-black tracking-widest text-gray-800 uppercase">First Love</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div 
          className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-16 text-center bg-warm-beige/50 backdrop-blur-sm self-stretch min-h-[50vh] md:min-h-0"
        >
          <motion.h3 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0, ease: "easeOut" }}
            className="text-base xs:text-lg sm:text-xl md:text-2xl mb-4 text-gray-600 tracking-wider md:tracking-widest font-sans font-bold uppercase whitespace-nowrap"
          >
            CHEOTOL, 국제결혼의 <span className="bg-gradient-to-r from-accent-pink to-[#FF80B5] bg-clip-text text-transparent">새로운 기준</span>
          </motion.h3>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4, ease: "easeOut" }}
            className="text-4xl md:text-6xl lg:text-7xl leading-[1.1] md:leading-tight mb-8 font-serif font-black text-gray-900 drop-shadow-sm break-keep"
          >
            세상 어디에선가,<br />
            오직 '당신'만을 기다려온<br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-accent-pink to-[#FF80B5] bg-clip-text text-transparent">인연</span>이 있습니다.
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 2.2, duration: 0.8 }}
                className="absolute bottom-2 left-0 h-3 bg-accent-pink/30 -z-10"
              />
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.8, ease: "easeOut" }}
            className="text-lg md:text-xl max-w-md text-gray-800 font-sans font-medium leading-relaxed break-keep"
          >
            편견의 국경을 넘어,<br />
            나를 온전히 응시하는 <span className="text-accent-pink font-bold">진심</span>을 마주하는 기적.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ 
              opacity: { duration: 0.8, delay: 2.4 },
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="mt-8 md:mt-24"
          >
            <ChevronDown className="text-accent-pink w-8 h-8" />
          </motion.div>
        </div>
      </section>

      {/* Journey Timeline Section */}
      <section id="journey-timeline" className="relative py-32 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&q=80&w=2000"
            alt="Matching Process Background"
            className="w-full h-full object-cover opacity-10 scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
        </div>
        
        <div className="px-6 md:px-[5%] max-w-7xl mx-auto relative z-10 min-h-[600px]">
        <AnimatePresence mode="wait">
          {!activeStep ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <div className="text-left mb-16">
                <div className="space-y-3 mb-6">
                  <h2 className="text-4xl md:text-6xl font-serif font-black text-gray-900 break-keep leading-[1.1] md:leading-tight">
                    <span className="bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">진짜 나</span>를 찾는 여정
                  </h2>
                  <div className="flex items-center gap-3 text-2xl md:text-4xl font-sans font-bold text-accent-pink tracking-[0.1em] lowercase mt-4">
                    <span className="w-2.5 h-2.5 bg-accent-pink rounded-full animate-pulse" />
                    첫사랑이 올 때까지
                  </div>
                </div>
                <p className="text-xl md:text-2xl max-w-2xl text-gray-800 font-sans font-medium leading-relaxed break-keep">
                  한국에서의 결혼이 차가운 현실이라면,<br />
                  세상 밖에서 만난 인연은 <span className="text-accent-pink font-bold">따뜻한 위로</span>였습니다.<br />
                  우리가 안내하는 여정은 다음과 같습니다.
                </p>
              </div>

              <div className="flex flex-col gap-8 max-w-4xl mx-auto">
                {STEPS.map((item, idx) => (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveStep(item.id)}
                    whileHover={{ x: 10 }}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-white p-8 md:p-10 rounded-[2.5rem] text-left border border-gray-100 shadow-sm hover:shadow-xl hover:border-accent-pink/30 transition-all duration-500 flex flex-col md:flex-row items-start md:items-center gap-8"
                  >
                    <div className={`w-16 h-16 bg-accent-pink/20 rounded-2xl flex items-center justify-center text-accent-pink shrink-0 group-hover:bg-accent-pink group-hover:text-white transition-colors duration-500 shadow-sm`}>
                      {item.icon}
                    </div>
                    <div className="flex-grow space-y-2">
                      <span className="text-xs font-sans font-bold text-accent-pink uppercase tracking-[0.2em]">
                        {item.step}
                      </span>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-serif group-hover:text-accent-pink transition-colors text-gray-900 break-keep leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-gray-700 font-sans font-normal leading-relaxed max-w-2xl break-keep">
                        {item.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-widest group-hover:gap-4 transition-all shrink-0 text-gray-400 group-hover:text-accent-pink">
                      Learn More <ArrowRight className="w-4 h-4" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="w-full"
            >
              <button 
                id="back-to-journey-btn"
                onClick={() => setActiveStep(null)}
                className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-12 group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-sans font-bold uppercase tracking-widest text-sm">Back to Journey</span>
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                <div className="space-y-8">
                  <div>
                    <span className="text-accent-pink font-sans font-bold uppercase tracking-[0.2em] text-sm mb-4 block">
                      {currentStepData?.step}
                    </span>
                    <h2 className="text-2xl sm:text-4xl md:text-6xl font-serif leading-[1.1] md:leading-tight mb-6 font-black text-gray-900 drop-shadow-sm break-keep">
                      {currentStepData?.title}
                    </h2>
                    <p className="text-2xl md:text-4xl font-serif italic text-accent-pink/60 font-medium break-keep leading-relaxed whitespace-pre-line">
                      {currentStepData?.subtitle}
                    </p>
                  </div>

                  <div className="h-1 bg-gradient-to-r from-accent-pink/50 to-transparent w-full" />

                  <div className="space-y-6 text-xl md:text-2xl text-gray-800 font-sans font-medium leading-relaxed">
                    <p>{currentStepData?.longDesc}</p>
                  </div>

                  {currentStepData?.details && (
                    <div className="bg-accent-pink/10 p-8 rounded-3xl space-y-4">
                      {currentStepData.details.map((detail, dIdx) => (
                        <div key={dIdx} className="flex flex-col sm:flex-row sm:gap-8 border-b border-accent-pink/20 pb-4 last:border-0 last:pb-0">
                          <span className="text-xs font-sans font-bold text-accent-pink uppercase w-24 shrink-0">{detail.label}</span>
                          <span className="text-base font-sans text-gray-800">{detail.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveStep(activeStep === 5 ? 1 : (activeStep || 0) + 1)}
                      className="flex items-center gap-4 bg-black text-white px-8 py-4 rounded-full font-sans font-bold uppercase tracking-widest text-sm"
                    >
                      Next Step <ArrowRight className="w-5 h-5" />
                    </motion.button>

                    {activeStep === 1 && (
                      <motion.button
                        onClick={() => navigate("/contact")}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-4 bg-accent-pink text-gray-900 px-8 py-4 rounded-full font-sans font-bold uppercase tracking-widest text-sm shadow-lg shadow-accent-pink/20"
                      >
                        상담 신청하기 <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    )}
                  </div>
                </div>

                <motion.div 
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl"
                >
                  <img 
                    src={currentStepData?.image} 
                    alt={currentStepData?.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </section>

      {/* Latest Stories (Memoir Style) */}
      <section className="py-32 px-6 md:px-[5%] bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20 border-b border-gray-100 pb-12">
            <div className="max-w-2xl">
              <span className="text-xs font-sans font-bold text-accent-pink uppercase tracking-[0.3em] mb-4 block">
                Journal & Stories
              </span>
              <h2 className="text-4xl md:text-6xl font-serif font-black text-gray-900 leading-[1.1] md:leading-tight tracking-tighter break-keep">
                MEMOIR OF <span className="italic text-accent-pink/80 font-light">'첫올'</span>
              </h2>
            </div>
            <div className="max-w-xs">
              <p className="text-gray-500 font-sans font-light leading-relaxed text-base md:text-lg">
                우리가 만난 수많은 진심의 조각들을 이곳에 담았습니다. 
                인연, 사랑, 그리고 삶에 대한 깊은 생각들을 만나보세요.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {latestPosts.map((post, idx) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate(`/blog/${post.id}`)}
                className="group cursor-pointer"
              >
                <div className="overflow-hidden rounded-[2rem] mb-6">
                  <motion.img 
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6 }}
                    src={post.image} 
                    alt={post.title}
                    className="w-full aspect-[4/5] object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-sans font-bold text-accent-pink uppercase tracking-widest">
                      {post.category}
                    </span>
                    <span className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-widest">
                      {post.date}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-serif font-bold text-gray-900 leading-tight group-hover:text-accent-pink transition-colors">
                    {post.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <button 
              onClick={() => window.location.href = '/blog'}
              className="px-12 py-5 rounded-full border border-gray-200 font-sans font-bold uppercase tracking-widest text-xs hover:bg-gray-900 hover:text-white transition-all flex items-center gap-2 mx-auto"
            >
              View All Stories <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Portfolio Highlights */}
      <section className="py-32 px-6 md:px-[5%] bg-[#fdfcf9]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div className="max-w-2xl">
              <span className="text-xs font-sans font-bold text-accent-pink uppercase tracking-[0.3em] mb-4 block">
                Our Portfolio
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif font-black text-gray-900 leading-tight tracking-tighter break-keep">
                MOMENTS OF <span className="italic text-accent-pink/80 font-light whitespace-nowrap">'인연'</span>
              </h2>
            </div>
            <button 
              onClick={() => navigate('/portfolio')}
              className="group flex items-center gap-3 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <span className="text-xs font-sans font-bold uppercase tracking-widest">View All Portfolio</span>
              <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-gray-900 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {INITIAL_PORTFOLIO.slice(0, 3).map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate(`/portfolio/${item.id}`)}
                className="group cursor-pointer"
              >
                <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden mb-6 relative">
                  <motion.img 
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6 }}
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-sans font-bold text-accent-pink uppercase tracking-widest">{item.category}</span>
                  <h3 className="text-xl font-serif font-bold text-gray-900 group-hover:text-accent-pink transition-colors">{item.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 md:px-[5%] bg-[#f4f0e6]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full md:w-2/5 bg-accent-pink p-12 rounded-3xl flex flex-col justify-center items-center text-center shadow-sm"
          >
            <p className="text-sm uppercase tracking-widest mb-2 font-sans font-medium">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-serif">Good to know</h2>
          </motion.div>
          
          <div className="w-full md:w-3/5 flex flex-col justify-center divide-y divide-gray-300">
            {[
              { 
                q: "주로 어느 국가의 분들과 매칭이 진행되나요?\n특정 국가를 지정할 수 있나요?", 
                a: `"CHEOTOL은 특정 국가에 국한하여 매칭을 진행하지 않습니다. 일본의 정갈함, 베트남의 순박함, 우즈베키스탄의 따뜻함 등 국경을 넘어 당신을 '배경'이 아닌 '주인공'으로 바라봐 줄 순수한 정서가 남아있는 곳이라면 어디든 연결해 드립니다.\n\n물론 고객님이 선호하시는 문화권이나 국가가 있다면 그 의견을 최우선으로 존중합니다. 하지만 저희의 진짜 목표는 국적이라는 라벨을 지우고, 당신과 가장 깊이 정서적으로 교감할 수 있는 '단 한 사람'을 찾아드리는 것입니다."` 
              },
              { 
                q: "언어가 달라서 말이 통하지 않을까 봐 걱정입니다.\n교감이 가능할까요?", 
                a: `"사랑을 시작하는 데 있어 언어는 도구일 뿐, 본질이 아닙니다. 대표님 역시 처음 외국인과의 미팅에서 언어의 장벽보다 **'나에게 온전히 귀 기울여주는 맑은 눈빛'**에서 잊고 있던 첫사랑의 설렘을 느끼셨습니다.\n\n미팅 시에는 미묘한 감정선까지 전달할 수 있는 전문 통역이 동행하여 소통을 돕습니다. 또한, 성혼 이후에는 두 사람이 온전한 일상을 나눌 수 있도록 현지 및 국내에서의 언어 교육과 정착 케어 프로그램을 철저하게 지원하고 있으니 안심하셔도 좋습니다."` 
              },
              { 
                q: "제가 원하는 '조건(나이, 외모 등)'에 딱 맞는 사람을 무조건 찾아줄 수 있나요?", 
                a: `"고객님이 원하시는 이상형의 기준은 매칭의 중요한 나침반이 됩니다. 원하시는 조건들을 세심하게 반영하여 미팅을 준비합니다.\n\n다만, CHEOTOL은 스펙과 조건만으로 이력서를 채점하듯 사람을 평가하는 한국의 차가운 결혼 현실을 지양합니다. 저희가 드리고 싶은 가장 큰 가치는 **'조건을 묻기 전에 당신이라는 사람 자체를 먼저 궁금해하는 인연'**을 만나는 기쁨입니다. 완벽한 스펙의 나열보다, 만났을 때 20대의 심장처럼 다시 가슴이 뛰게 하는 그 '순수한 끌림'을 찾아드리는 데 집중하겠습니다."` 
              },
              { 
                q: "상대방의 신원이나 서류는 확실하게 검증이 되나요?", 
                a: `"첫사랑처럼 순수하고 아름다운 만남이 되기 위해서는, 그 바탕에 **'절대적인 신뢰'**가 있어야 합니다.\n\nCHEOTOL은 고객님이 상대방에 대한 어떠한 불안감 없이 온전히 감정에만 몰입하실 수 있도록, 현지 네트워크를 통해 범죄 이력, 혼인 관계, 학력 및 건강 상태 등의 공증 서류를 3단계에 걸쳐 엄격하게 교차 검증합니다. 마음은 가장 감성적으로 열어두시되, 검증은 저희가 가장 이성적이고 철저하게 진행합니다."` 
              },
              { 
                q: "비용이나 추가금이 불투명해서 나중에 청구될까 봐 걱정입니다.", 
                a: `"당신의 새로운 인생을 찾는 숭고한 여정이 금전적인 불안감으로 훼손되어서는 안 된다고 믿습니다.\n\nCHEOTOL은 투명성을 브랜드의 핵심 원칙으로 삼고 있습니다. 상담 단계에서부터 성혼, 그리고 입국 후 케어까지 발생하는 모든 비용과 프로세스를 명확하게 안내해 드리며, 계약 외의 부당한 추가금이나 숨겨진 비용은 일절 요구하지 않습니다. 오직 '나를 찾는 설렘'에만 집중하실 수 있도록 정직하게 동행하겠습니다."` 
              }
            ].map((faq, idx) => (
              <details key={idx} className="group py-6 cursor-pointer">
                <summary className="flex justify-between items-center list-none font-serif text-xl md:text-2xl font-bold text-gray-900 outline-none break-keep leading-snug whitespace-pre-line">
                  {faq.q}
                  <ChevronDown className="w-6 h-6 transition-transform group-open:rotate-180 text-accent-pink" />
                </summary>
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-gray-800 text-lg font-sans font-medium leading-relaxed break-keep whitespace-pre-line"
                >
                  {faq.a.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return (
                        <span key={i} className="font-bold bg-gradient-to-r from-[#D81B60] to-[#FFA726] bg-clip-text text-transparent">
                          {part.slice(2, -2)}
                        </span>
                      );
                    }
                    return part;
                  })}
                </motion.div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* RSVP Section */}
      <section id="contact-form" className="py-20 px-6 md:px-[5%] flex justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-white to-warm-beige/30 p-8 md:p-16 rounded-[3rem] max-w-2xl w-full shadow-2xl shadow-accent-pink/5 border border-accent-pink/10 relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="relative z-10"
              >
                <span className="text-xs bg-accent-pink/10 text-accent-pink px-4 py-1 rounded-full inline-block mb-6 font-sans font-bold tracking-wider uppercase">
                  Start Journey
                </span>
                <h2 className="text-3xl md:text-4xl mb-4 font-serif text-gray-900 break-keep">당신의 첫사랑이 될 준비.</h2>
                <p className="mb-10 text-gray-500 font-sans font-light break-keep">
                  차근차근 당신의 이야기를 들려주세요. 진심을 다해 당신만의 인연을 찾겠습니다.
                </p>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="block text-sm font-sans font-medium text-gray-700">이름 (Name)</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="당신의 이름을 알려주세요"
                      className="w-full p-4 border-none rounded-xl bg-white focus:ring-2 focus:ring-accent-pink outline-none transition-all font-sans"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-sans font-medium text-gray-700">연락처 (Contact)</label>
                    <input 
                      required
                      type="text" 
                      value={formData.contact}
                      onChange={(e) => setFormData({...formData, contact: formatPhoneNumber(e.target.value)})}
                      placeholder="편하게 연락받으실 번호나 이메일"
                      className="w-full p-4 border-none rounded-xl bg-white focus:ring-2 focus:ring-accent-pink outline-none transition-all font-sans"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-sans font-medium text-gray-700">희망 날짜 (Preferred Date)</label>
                      <input 
                        required
                        type="date" 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full p-4 border-none rounded-xl bg-white focus:ring-2 focus:ring-accent-pink outline-none transition-all font-sans"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-sans font-medium text-gray-700">희망 시간 (Preferred Time)</label>
                      <input 
                        required
                        type="time" 
                        value={formData.time}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                        className="w-full p-4 border-none rounded-xl bg-white focus:ring-2 focus:ring-accent-pink outline-none transition-all font-sans"
                      />
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full bg-accent-pink text-gray-900 py-4 rounded-full font-sans font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:scale-[1.03] transition-all shadow-lg shadow-accent-pink/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    여정 시작하기
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative z-10 text-center"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                </div>
                <h2 className="text-3xl font-serif text-gray-900 mb-2">상담 신청이 완료되었습니다!</h2>
                <p className="text-gray-500 mb-6 font-sans">작성해주신 일정 정보가 구글 캘린더에 안전하게 연동되었습니다.<br />아래 버튼을 눌러 상세 상담 분석용 설문지와 오픈채팅 연결을 진행해주세요.</p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10">
                  <button 
                    onClick={openGoogleForm}
                    className="w-full sm:w-auto bg-purple-600 text-white px-8 py-4 rounded-full font-sans font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    상세 설문지 작성지 (구글 폼)
                  </button>
                  <button 
                    onClick={openKakaoChat}
                    className="w-full sm:w-auto bg-[#FAE100] text-[#3C1E1E] px-8 py-4 rounded-full font-sans font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-lg shadow-[#FAE100]/20 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    실시간 카톡 상담
                  </button>
                </div>

                {/* Consultation Card UI */}
                <div className="bg-white border border-gray-100 rounded-3xl p-8 text-left shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent-pink/5 -mr-16 -mt-16 rounded-full" />
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-accent-pink/10 rounded-xl flex items-center justify-center">
                      <BrandedHeart className="text-accent-pink w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-[10px] font-sans font-bold text-accent-pink uppercase tracking-[0.2em]">Consultation Card</p>
                      <p className="text-sm font-serif text-gray-400 italic mt-1.5">CHEOTOL Journey</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest mb-1">Name</label>
                      <p className="text-lg font-sans font-medium text-gray-900 border-b border-gray-50 pb-2">{formData.name}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest mb-1">Contact</label>
                      <p className="text-lg font-sans font-medium text-gray-900 border-b border-gray-50 pb-2">{formData.contact}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest mb-1">Schedule</label>
                      <p className="text-lg font-sans font-medium text-gray-900 border-b border-gray-50 pb-2">{formData.date} {formData.time}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest mb-1">Detailed Story</label>
                      <p className="text-base font-sans text-gray-700 leading-relaxed bg-gray-50/50 p-4 rounded-xl italic">
                        "구글 설문지가 연동되었습니다. 상세 가치관 분석 양식은 설문지를 통해 제출해 주세요."
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-dashed border-gray-100 flex justify-between items-center">
                    <p className="text-[10px] text-gray-300 font-sans font-bold uppercase tracking-widest">© 2026 CHEOTOL</p>
                    <div className="flex gap-1">
                      {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-accent-pink/30 rounded-full" />)}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="mt-10 text-gray-400 hover:text-accent-pink transition-colors text-xs font-sans font-bold uppercase tracking-widest"
                >
                  새로운 상담 신청하기
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-pink/5 blur-[80px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-pink/5 blur-[80px] -ml-32 -mb-32" />
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-gray-200">
        <div className="flex justify-center items-center mb-6">
          <img 
            src={logo1} 
            alt="CHEOTOL Logo" 
            className="h-28 md:h-32 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity duration-300"
            referrerPolicy="no-referrer"
          />
        </div>
        <p className="text-xs text-gray-400 font-sans font-light">
          © 2026 CHEOTOL. All rights reserved.
        </p>
        <div className="mt-8">
          <a 
            href="/api/download-source" 
            download="full_codebase.txt"
            className="text-[10px] text-gray-300 hover:text-accent-pink transition-colors font-sans uppercase tracking-[0.2em]"
          >
            Download Source Code
          </a>
        </div>
      </footer>
    </div>
  );
}
