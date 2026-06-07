import { motion } from "motion/react";

const logo1 = new URL("../assets/logo1.png", import.meta.url).href;
const aboutImage = new URL("../about_illustration.png", import.meta.url).href;

export default function About() {
  return (
    <div className="pt-24 px-6 md:px-[5%] max-w-7xl mx-auto min-h-screen pb-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start"
      >
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-serif leading-[1.1] md:leading-tight break-keep">
              About<br />
              <span className="relative inline-block">
                CHEOTOL(첫올)
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="absolute bottom-1 left-0 h-2 bg-accent-pink/60 -z-10"
                />
              </span>
            </h1>
            <p className="text-xl text-gray-600 font-sans font-light leading-relaxed break-keep">
              CHEOTOL은 단순한 매칭 서비스를 넘어, 국경과 언어의 장벽을 허물고 
              사람과 사람이 가진 본연의 가치를 연결하는 '인연의 예술'을 지향합니다.
            </p>
          </div>

          <div className="h-px bg-gray-200 w-full" />

          {/* 첫올의 의미 카드 섹션 (The Meaning of CHEOTOL) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#FAF8F5] p-8 rounded-3xl border border-[#EBE6DD] space-y-5 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-pink/5 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
            
            <div className="flex items-center gap-2">
              <span className="text-accent-pink font-serif text-xl animate-pulse">♥</span>
              <h3 className="font-serif text-lg text-gray-800 font-medium select-none">첫올(CHEOTOL)에 담긴 아름다운 약속</h3>
            </div>
            
            <div className="space-y-4 font-sans font-light text-gray-600 leading-relaxed text-sm break-keep">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base text-gray-800 font-medium">
                    <span className="font-bold text-gray-950 border-b-2 border-accent-pink/40 pb-0.5">‘첫사랑이 올 때까지’</span>
                  </span>
                  <span className="text-[10px] bg-accent-pink/10 text-accent-pink px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    Brand Name Origin
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-medium pl-0.5 flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-accent-pink rounded-full" />
                  진짜 나를 찾는 여정
                </span>
              </div>
              
              <p>
                <strong className="font-medium text-gray-900">첫올</strong>은 <span className="font-semibold text-gray-900">"첫사랑이 올 때까지"</span>의 뜻깊은 줄임말입니다. 
                살면서 마주할 수 있는 가장 순수하고 깊은 감정인 ‘첫사랑’ 같은 찬란한 인연이 찾아오는 그 찬란한 순간까지, 늘 동반자처럼 한결같은 성과 진심으로 곁을 지키겠다는 다짐과 약속입니다.
              </p>
              
              <p>
                만남의 시작부터 따뜻한 보금자리를 꾸리고 서로의 일상에 온전히 스며들어 평생의 안식을 누릴 때까지, 
                첫올은 단순한 주선이 아닌 <span className="font-medium text-gray-900 border-b border-gray-300">신뢰와 운명 그리고 한 가족을 맺어주는 동반 관계</span>를 최우선 가치로 삼습니다.
              </p>
              
              <div className="h-px bg-[#EBE6DD] my-2" />
              
              <p className="text-xs text-gray-500 font-light italic leading-relaxed">
                “설렘으로 싹튼 첫 만남부터 평생의 사랑으로 완성되는 그 아름다운 결실까지, 첫사랑이 찾아올 때까지 첫올이 항상 동행하겠습니다.”
              </p>
            </div>
          </motion.div>

          <p className="text-base text-gray-500 font-sans font-light leading-relaxed break-keep">
            우리는 모든 사람이 자신만의 고유한 빛을 가지고 있다고 믿습니다. 
            그 빛을 알아봐 줄 단 한 사람을 찾는 여정, 그 시작에 CHEOTOL이 함께합니다.
          </p>
        </div>

        <div className="relative md:sticky md:top-28 space-y-6">
          {/* Brand Logo Container */}
          <div className="bg-transparent flex items-center justify-center p-4 md:p-6 transition-all duration-500 group">
            <img 
              src={logo1} 
              alt="CHEOTOL Official Logo"
              className="max-h-30 md:max-h-42 object-contain w-auto h-auto transition-transform duration-500 group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Core Illustration Container */}
          <div className="aspect-[4/3] rounded-[3rem] overflow-hidden bg-[#F9F7F2] shadow-[0_32px_64px_-16px_rgba(180,160,140,0.2)] border border-[#E8E2D9]">
            <img 
              src={aboutImage} 
              alt="CHEOTOL Storefront"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://picsum.photos/seed/error/800/600";
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
