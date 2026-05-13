import { motion } from "motion/react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const PACKAGES = [
  {
    title: "Basic Journey (Japan)",
    price: "7,000,000원",
    desc: "기존 타사 'STANDARD(700)' 등급 기준. 일본 인연을 찾는 첫걸음, 꼭 필요한 핵심 서비스만 담은 실속형 패키지입니다.",
    features: [
      "무제한 온라인 화상 미팅 및 통역 지원",
      "매력을 돋보이게 하는 전문 프로필 작성 지원",
      "일본 현지 방문 시 통역 및 가이드 지원 (1회)",
      "네트워킹을 위한 성혼자 모임 초대"
    ]
  },
  {
    title: "Premium Journey (Japan)",
    price: "9,000,000원",
    desc: "기존 타사 'PREMIUM(900)' 등급 기준. 더 깊은 교감과 확실한 만남을 위해 매니저 추천과 노하우가 더해진 프리미엄 케어입니다.",
    features: [
      "무제한 화상 미팅 및 전담 매니저의 엄선된 추천 (월 1회)",
      "성공률을 높이는 매칭 단계별 노하우 파일 제공",
      "일본 현지 방문 시 통역 및 가이드 확대 지원 (2회)",
      "계약 기간 중 국내(한국인) 매칭 서비스 무료 지원 (2회)"
    ],
    highlight: true
  },
  {
    title: "Global VIP Journey (Japan)",
    price: "15,000,000원",
    desc: "기존 타사 'VIP(1,500)' 등급 기준. 프로필 촬영부터 1:1 맞춤 직접 소개까지, 전 과정을 완벽하게 책임지는 최상위 서비스입니다.",
    features: [
      "원하는 조건의 회원 직접 써칭 및 매니저 1:1 맞춤 소개",
      "전문가 스타일링(1회) 및 프리미엄 프로필 촬영 지원",
      "일본 현지 방문 시 통역 및 가이드 밀착 지원 (2회)",
      "국내 매칭 무료 지원(2회) 및 VIP 전담 풀 케어 제공"
    ]
  }
];

const EXPECTATIONS = [
  { step: "01", title: "Initial Consultation", desc: "당신의 가치관과 꿈꾸는 인연에 대해 깊이 있게 대화합니다." },
  { step: "02", title: "Curation & Matching", desc: "일본 네트워크에서 당신과 가장 잘 어울리는 인연을 찾습니다." },
  { step: "03", title: "Virtual Connection", desc: "화면을 통해 서로의 눈빛과 진심을 먼저 확인합니다." },
  { step: "04", title: "Real-life Meeting", desc: "물리적 거리를 넘어 실제로 마주하는 설레는 순간을 지원합니다." }
];

export default function JapanService() {
  return (
    <div className="pt-24 pb-24 px-6 md:px-[5%] max-w-7xl mx-auto min-h-screen">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-24"
      >
        <span className="text-xs font-sans font-bold text-accent-pink uppercase tracking-[0.4em] mb-4 block">
          Japan Services
        </span>
        <h1 className="text-5xl md:text-8xl font-serif mb-8 tracking-tight leading-[1.1] md:leading-tight break-keep">
          Japan Packages
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto font-sans font-light leading-relaxed">
          "일본에서의 소중한 인연, CHEOTOL이 함께합니다."
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
              <div className="text-2xl sm:text-3xl lg:text-4xl font-serif text-accent-pink mb-4">{pkg.price}</div>
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
              일본 인연을 찾는 여정은 투명하고 체계적입니다. 
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
