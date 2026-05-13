import React, { useState } from "react";
import { motion } from "motion/react";
import { Send, MessageCircle, Calendar as CalendarIcon, Clock } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
    date: "",
    time: "14:00"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setIsSuccess(true);
        setFormData({ name: "", phone: "", message: "", date: "", time: "14:00" });
      } else {
        alert("상담 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("Consultation submission error:", error);
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 px-6 md:px-[5%] max-w-7xl mx-auto min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start"
      >
        <div className="space-y-8">
          <h1 className="text-5xl md:text-7xl font-serif leading-tight">
            Get in<br />Touch
          </h1>
          <p className="text-xl text-gray-600 font-sans font-light leading-relaxed">
            당신의 새로운 여정을 시작할 준비가 되셨나요? 
            언제든지 편하게 문의해 주세요.
          </p>
          <div className="h-px bg-gray-200 w-full" />
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-xs font-sans font-bold text-gray-400 uppercase tracking-widest mb-1">Email</span>
              <span className="text-lg font-sans text-gray-800">contact@cheotol.com</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-sans font-bold text-gray-400 uppercase tracking-widest mb-1">Phone</span>
              <span className="text-lg font-sans text-gray-800">+82 02-123-4567</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-sans font-bold text-gray-400 uppercase tracking-widest mb-1">Address</span>
              <span className="text-lg font-sans text-gray-800">서울특별시 강남구 테헤란로 123</span>
            </div>
          </div>

          <div className="pt-8">
            <button 
              onClick={() => (window as any).Tawk_API?.toggle()}
              className="inline-flex items-center gap-3 bg-accent-pink text-gray-900 px-8 py-4 rounded-full font-bold text-sm hover:scale-[1.03] transition-transform shadow-lg shadow-accent-pink/20"
            >
              <MessageCircle className="w-6 h-6" />
              실시간 상담하기
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-gray-100"
        >
          {isSuccess ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Send className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-serif">상담 신청 완료!</h2>
              <p className="text-gray-500 font-sans">문의하신 일정이 캘린더에 예약되었습니다.<br />곧 연락드리겠습니다.</p>
              <button 
                onClick={() => setIsSuccess(false)}
                className="mt-8 text-accent-pink font-bold text-sm uppercase tracking-widest"
              >
                추가 문의하기
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest">이름 (Name)</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="성함을 입력해주세요"
                      className="w-full p-4 border-none rounded-2xl bg-gray-50 focus:ring-2 focus:ring-accent-pink outline-none transition-all font-sans text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest">연락처 (Contact)</label>
                    <input 
                      required
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="010-0000-0000"
                      className="w-full p-4 border-none rounded-2xl bg-gray-50 focus:ring-2 focus:ring-accent-pink outline-none transition-all font-sans text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" /> 희망 날짜
                    </label>
                    <input 
                      required
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full p-4 border-none rounded-2xl bg-gray-50 focus:ring-2 focus:ring-accent-pink outline-none transition-all font-sans text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 희망 시간
                    </label>
                    <input 
                      required
                      type="time" 
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full p-4 border-none rounded-2xl bg-gray-50 focus:ring-2 focus:ring-accent-pink outline-none transition-all font-sans text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-sans font-black text-gray-400 uppercase tracking-widest">문의 내용 (Message)</label>
                  <textarea 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="상담하고 싶은 내용을 자유롭게 적어주세요."
                    className="w-full p-4 border-none rounded-2xl bg-gray-50 h-32 resize-none focus:ring-2 focus:ring-accent-pink outline-none transition-all font-sans text-sm"
                  />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-5 rounded-2xl font-sans font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </motion.button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
