import { useState, useRef, ChangeEvent } from "react";
import { motion } from "motion/react";
import { Edit2, Check, Upload, X, RotateCcw } from "lucide-react";

export default function About() {
  const defaultImage = "https://storage.googleapis.com/multimodal_perception_images/2026-03-26/06:48:08_1743058088.png";
  
  const [imageUrl, setImageUrl] = useState(() => {
    const saved = localStorage.getItem("about_page_image");
    return saved || defaultImage;
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempUrl, setTempUrl] = useState(imageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setImageUrl(tempUrl);
    localStorage.setItem("about_page_image", tempUrl);
    setIsEditing(false);
  };

  const handleReset = () => {
    setImageUrl(defaultImage);
    setTempUrl(defaultImage);
    localStorage.removeItem("about_page_image");
    setIsEditing(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageUrl(base64String);
        setTempUrl(base64String);
        localStorage.setItem("about_page_image", base64String);
        setIsEditing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="pt-24 px-6 md:px-[5%] max-w-7xl mx-auto min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
      >
        <div className="space-y-8">
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
          <p className="text-xl text-gray-600 font-sans font-light leading-relaxed">
            CHEOTOL은 단순한 매칭 서비스를 넘어, 국경과 언어의 장벽을 허물고 
            사람과 사람이 가진 본연의 가치를 연결하는 '인연의 예술'을 지향합니다.
          </p>
          <div className="h-px bg-gray-200 w-full" />
          <p className="text-lg text-gray-500 font-sans font-light">
            우리는 모든 사람이 자신만의 고유한 빛을 가지고 있다고 믿습니다. 
            그 빛을 알아봐 줄 단 한 사람을 찾는 여정, 그 시작에 CHEOTOL이 함께합니다.
          </p>
        </div>

        <div className="relative group">
          <div className="aspect-[4/3] rounded-[3rem] overflow-hidden bg-[#F9F7F2] shadow-[0_32px_64px_-16px_rgba(180,160,140,0.2)] border border-[#E8E2D9]">
            <img 
              src={imageUrl} 
              alt="CHEOTOL Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://picsum.photos/seed/error/800/600";
              }}
            />
          </div>
          
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            {isEditing ? (
              <div className="flex flex-col bg-white/90 backdrop-blur-xl p-4 rounded-3xl shadow-2xl gap-3 border border-[#E8E2D9] w-64 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">Update Image</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleReset} 
                      className="text-gray-400 hover:text-accent-pink transition-colors"
                      title="Reset to default"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-black">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={triggerFileUpload}
                  className="w-full py-3 px-4 bg-accent-pink/10 border border-dashed border-accent-pink/30 rounded-xl flex items-center justify-center gap-2 text-accent-pink hover:bg-accent-pink/20 transition-all group/btn"
                >
                  <Upload className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                  <span className="text-xs font-sans font-bold uppercase tracking-widest">Upload File</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-sans font-bold text-gray-300"><span className="bg-white px-2">or URL</span></div>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="Paste image URL..."
                    className="text-xs p-3 border border-gray-100 rounded-xl outline-none flex-grow font-sans bg-gray-50 focus:bg-white focus:ring-2 focus:ring-accent-pink/20 transition-all"
                  />
                  <button 
                    onClick={handleSave}
                    className="p-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-4 bg-white/90 backdrop-blur text-gray-600 rounded-full shadow-lg hover:bg-black hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                <span className="text-xs font-sans font-bold uppercase tracking-widest pr-2">Edit Image</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
