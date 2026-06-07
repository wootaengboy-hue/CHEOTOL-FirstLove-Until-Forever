import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Lock, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

const PACKAGES = [
  {
    title: "Basic Journey (Uzbekistan)",
    price: "계약금 4,000,000원\n잔금 1,800,000원",
    desc: "기존 타사 'STANDARD' 등급 기준. 우즈베키스탄 인연을 찾는 첫걸음, 꼭 필요한 방문 및 매칭 서비스를 제공하는 실속형 패키지입니다.",
    features: [
      "사전 선발(10명) 및 화상 매칭을 통한 철저한 준비",
      "우즈벡 현지 방문 시 최종 4명 심층 매칭",
      "왕복 항공권(1회), 숙식 및 현지 기본 교통 지원",
      "전문 통역 지원 및 모든 행정 서류 비용 포함"
    ]
  },
  {
    title: "Premium Journey (Uzbekistan)",
    price: "계약금 4,000,000원\n잔금 2,000,000원",
    desc: "기존 타사 'PREMIUM' 등급 기준. 더 넓은 선택의 폭과 편안한 현지 일정을 제공하는, 가장 만족도가 높은 프리미엄 서비스입니다.",
    features: [
      "우즈벡 현지 방문 시 최종 4~6명 맞춤 심층 매칭",
      "성혼비 50% 지원으로 비용 부담 완화",
      "왕복 항공권(1회) 및 기사 포함 전용 차량(1회) 제공",
      "전문 통역 및 모든 행정 서류 완벽 처리"
    ],
    highlight: true
  },
  {
    title: "Global VIP Journey (Uzbekistan)",
    price: "별도 협의",
    desc: "기존 타사 'VIP' 등급 기준. 매칭부터 성혼, 신부의 정착 지원까지 세심하게 배려하는 최상위 VIP 풀 케어 서비스입니다.",
    features: [
      "왕복 항공권(2회) 및 숙박(2회), 기사 포함 차량 제공",
      "폭넓은 현지 최종 6명 심층 매칭 및 성혼비 전액 지원",
      "지참금, 예물, 한국어 공부 및 생활비 50% 파격 지원",
      "통역, 서류 처리는 물론 전 일정 VIP 전담 밀착 케어"
    ]
  }
];

const EXPECTATIONS = [
  { step: "01", title: "Initial Consultation", desc: "당신의 가치관과 꿈꾸는 인연에 대해 깊이 있게 대화합니다." },
  { step: "02", title: "Curation & Matching", desc: "우즈베키스탄 네트워크에서 당신과 가장 잘 어울리는 인연을 찾습니다." },
  { step: "03", title: "Virtual Connection", desc: "화면을 통해 서로의 눈빛과 진심을 먼저 확인합니다." },
  { step: "04", title: "Real-life Meeting", desc: "물리적 거리를 넘어 실제로 마주하는 설레는 순간을 지원합니다." }
];

export default function UzbekistanService() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setIsAdmin(u ? u.email === "wootaengboy@gmail.com" : false);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-beige/30 flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full border-2 border-accent-pink border-t-transparent animate-spin" />
          <span className="text-xs font-sans font-bold tracking-widest text-accent-pink uppercase">Loading secure contents...</span>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-warm-beige/20 pt-32 pb-24 px-6 md:px-[5%] flex items-center justify-center relative">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-accent-pink/5 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-accent-pink/5 blur-[100px] rounded-full -z-10" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full bg-white/60 backdrop-blur-md border border-white shadow-xl rounded-[3rem] p-12 md:p-16 text-center"
        >
          <div className="w-20 h-20 bg-accent-pink/5 border border-accent-pink/10 rounded-3xl flex items-center justify-center text-accent-pink mx-auto mb-8 animate-pulse">
            <Lock className="w-10 h-10" />
          </div>
          <span className="text-xs font-sans font-bold text-accent-pink uppercase tracking-[0.4em] mb-4 block">
            Access Restricted
          </span>
          <h2 className="text-3xl md:text-5xl font-serif mb-6 leading-tight text-gray-900 break-keep">
            우즈베키스탄 매칭 서비스 <br/>
            <span className="text-gray-500 italic">조회 제한 안내</span>
          </h2>
          <p className="text-gray-500 font-sans font-light leading-relaxed max-w-md mx-auto mb-12 break-keep text-sm md:text-base">
            우즈베키스탄 서비스는 현재 관리자(Admin) 계정 전용으로 활성화되어 일반 사용자의 접근이 제한되어 있습니다. 궁금한 점이 있으시다면 실시간 상담을 이용하시거나 일본 매칭 서비스를 둘러보세요.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/services/japan"
              className="bg-black text-white px-8 py-4 rounded-full font-sans font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-lg shadow-black/10 inline-flex items-center justify-center gap-2"
            >
              일본 서비스 보기 <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/"
              className="bg-white text-gray-900 border border-gray-100 px-8 py-4 rounded-full font-sans font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition-all shadow-sm"
            >
              홈으로 가기
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 px-6 md:px-[5%] max-w-7xl mx-auto min-h-screen">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-24"
      >
        <span className="text-xs font-sans font-bold text-accent-pink uppercase tracking-[0.4em] mb-4 block">
          Uzbekistan Services
        </span>
        <h1 className="text-5xl md:text-8xl font-serif mb-8 tracking-tight leading-[1.1] md:leading-tight break-keep">
          Uzbekistan Packages
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto font-sans font-light leading-relaxed">
          "우즈베키스탄에서의 소중한 인연, CHEOTOL이 함께합니다."
        </p>
      </motion.div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-32">
        {PACKAGES.map((pkg, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className={`relative p-8 sm:p-12 rounded-[3rem] border ${
              pkg.highlight ? "border-accent-pink bg-white shadow-2xl" : "border-gray-100 bg-white/50"
            } flex flex-col h-full group hover:border-accent-pink transition-all duration-500`}
          >
            {pkg.highlight && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent-pink text-gray-900 px-6 py-1 rounded-full text-xs font-sans font-bold uppercase tracking-widest">
                Most Popular
              </span>
            )}
            <div className="mb-8">
              <h3 className="text-3xl font-serif mb-2">{pkg.title}</h3>
              <div className="text-base sm:text-2xl lg:text-3xl font-serif text-accent-pink mb-4 whitespace-pre-line leading-tight break-keep">
                {pkg.price}
              </div>
              <p className="text-gray-500 font-sans font-light text-sm leading-relaxed">
                {pkg.desc}
              </p>
            </div>
            
            <div className="h-px bg-gray-100 w-full mb-8" />

            <ul className="space-y-4 mb-12 flex-grow">
              {pkg.features.map((feature, fIdx) => (
                <li key={fIdx} className="flex items-start gap-3 text-sm text-gray-600 font-sans font-light">
                  <CheckCircle2 className="w-4 h-4 text-accent-pink shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link 
              to="/contact"
              className={`w-full py-4 rounded-full font-sans font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                pkg.highlight ? "bg-black text-white hover:bg-gray-800" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              Book Now <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* What to Expect Section */}
      <section className="mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-sans font-bold text-accent-pink uppercase tracking-[0.4em] mb-4 block">
              The Process
            </span>
            <h2 className="text-4xl md:text-6xl font-serif mb-8 leading-[1.1] md:leading-tight break-keep">
              What to Expect
            </h2>
            <p className="text-lg text-gray-500 font-sans font-light leading-relaxed mb-12">
              우즈베키스탄 인연을 찾는 여정은 투명하고 체계적입니다. 
              우리는 당신의 소중한 인연을 찾는 모든 순간을 최고의 경험으로 만들기 위해 노력합니다.
            </p>
            <Link 
              to="/about"
              className="inline-flex items-center gap-4 text-sm font-sans font-bold uppercase tracking-widest group"
            >
              Learn More About Us <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all"><ArrowRight className="w-4 h-4" /></div>
            </Link>
          </div>

          <div className="space-y-8">
            {EXPECTATIONS.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-8 group"
              >
                <span className="text-4xl font-serif text-gray-200 group-hover:text-accent-pink transition-colors">
                  {item.step}
                </span>
                <div>
                  <h4 className="text-xl font-serif mb-2">{item.title}</h4>
                  <p className="text-gray-600 font-sans font-normal text-base leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Any Queries Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-accent-pink/5 to-accent-pink/10 text-gray-900 p-16 md:p-24 rounded-[4rem] text-center relative overflow-hidden border border-accent-pink/20 shadow-2xl shadow-accent-pink/5"
      >
        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-serif mb-8 leading-[1.1] md:leading-tight break-keep">Any Queries?</h2>
          <p className="text-gray-500 max-w-xl mx-auto font-sans font-light mb-12">
            당신만의 특별한 인연을 찾는 여정,<br />지금 바로 시작하세요.<br />
            전문 매니저가 당신의 모든 과정을 함께합니다.
          </p>
          <Link 
            to="/contact"
            className="inline-flex items-center gap-4 bg-accent-pink text-gray-900 px-12 py-5 rounded-full font-sans font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-lg shadow-accent-pink/20"
          >
            Contact Us <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        
        {/* Abstract background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-pink/5 blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-pink/5 blur-[100px] -ml-32 -mb-32" />
      </motion.section>
    </div>
  );
}
