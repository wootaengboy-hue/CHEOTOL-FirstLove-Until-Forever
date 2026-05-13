import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, User } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  text: string;
  sender: "user" | "admin";
  timestamp: number;
}

import BrandedHeart from "./BrandedHeart";

export default function KakaoChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate or get persistent room ID
    let storedRoomId = localStorage.getItem("chat_room_id");
    if (!storedRoomId) {
      storedRoomId = `room_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem("chat_room_id", storedRoomId);
    }
    setRoomId(storedRoomId);

    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit("join_room", storedRoomId);

    newSocket.on("receive_message", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    // Load history from localStorage
    const history = localStorage.getItem(`chat_history_${storedRoomId}`);
    if (history) {
      setMessages(JSON.parse(history));
    }

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (roomId && messages.length > 0) {
      localStorage.setItem(`chat_history_${roomId}`, JSON.stringify(messages));
    }
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, roomId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socket || !roomId) return;

    const newMessage: Message = {
      text: message,
      sender: "user",
      timestamp: Date.now(),
    };

    socket.emit("send_message", { ...newMessage, room: roomId });
    setMessage("");
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[350px] h-[500px] bg-white rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-accent-pink p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <BrandedHeart size={24} color="white" />
                </div>
                <div className="flex flex-col items-center">
                  <h4 className="font-serif font-bold text-base leading-none">첫올 실시간 상담</h4>
                  <p className="text-[8px] opacity-80 uppercase tracking-[0.2em] mt-1.5">First Love Until Forever</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-4 bg-gray-50/50">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-400 font-sans">안녕하세요! 궁금하신 점을 말씀해 주세요.</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl text-sm font-sans ${
                      msg.sender === "user"
                        ? "bg-black text-white rounded-tr-none"
                        : "bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="flex-grow p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-1 focus:ring-accent-pink transition-all"
              />
              <button
                type="submit"
                className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-[#FAE100] text-[#3C1E1E] rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl transition-all relative"
      >
        <MessageCircle className="w-8 h-8" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
          1
        </span>
      </motion.button>
    </div>
  );
}
