import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { MessageCircle, X, Send, User, Search, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  text: string;
  sender: "user" | "admin";
  timestamp: number;
  room: string;
}

interface Room {
  id: string;
  lastMessage: string;
  timestamp: number;
  unread: boolean;
}

export default function AdminChat() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit("join_admin");

    newSocket.on("receive_message", (data: Message) => {
      setMessages((prev) => ({
        ...prev,
        [data.room]: [...(prev[data.room] || []), data],
      }));

      setRooms((prev) => {
        const existing = prev.find((r) => r.id === data.room);
        if (existing) {
          return [
            { ...existing, lastMessage: data.text, timestamp: data.timestamp, unread: data.room !== activeRoom },
            ...prev.filter((r) => r.id !== data.room),
          ];
        }
        return [
          { id: data.room, lastMessage: data.text, timestamp: data.timestamp, unread: data.room !== activeRoom },
          ...prev,
        ];
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [activeRoom]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, activeRoom]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !activeRoom) return;

    const newMessage: Message = {
      text: input,
      sender: "admin",
      timestamp: Date.now(),
      room: activeRoom,
    };

    socket.emit("send_message", newMessage);
    setInput("");
  };

  const currentMessages = activeRoom ? messages[activeRoom] || [] : [];

  return (
    <div className="pt-24 h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-2xl font-serif font-bold">Chats</h2>
          <Settings className="w-5 h-5 text-gray-400 cursor-pointer hover:text-black transition-colors" />
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-1 focus:ring-accent-pink transition-all"
            />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {rooms.length === 0 && (
            <div className="p-10 text-center text-gray-400 text-sm">
              No active conversations.
            </div>
          )}
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => {
                setActiveRoom(room.id);
                setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, unread: false } : r)));
              }}
              className={`w-full p-6 text-left hover:bg-gray-50 transition-all border-b border-gray-50 flex items-center gap-4 ${
                activeRoom === room.id ? "bg-accent-pink/5 border-l-4 border-l-accent-pink" : ""
              }`}
            >
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-sans font-bold text-sm truncate">{room.id}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(room.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{room.lastMessage}</p>
              </div>
              {room.unread && <div className="w-2 h-2 bg-accent-pink rounded-full shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-grow flex flex-col bg-white">
        {activeRoom ? (
          <>
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-pink/10 rounded-2xl flex items-center justify-center text-accent-pink">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg">{activeRoom}</h3>
                  <p className="text-xs text-green-500 font-sans font-medium uppercase tracking-widest">Online</p>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-grow p-10 overflow-y-auto space-y-6 bg-gray-50/30">
              {currentMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[60%] p-5 rounded-3xl text-sm font-sans shadow-sm ${
                      msg.sender === "admin"
                        ? "bg-black text-white rounded-tr-none"
                        : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                    <div
                      className={`text-[9px] mt-2 opacity-50 ${
                        msg.sender === "admin" ? "text-right" : "text-left"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-8 bg-white border-t border-gray-100 flex gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-grow p-4 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-1 focus:ring-accent-pink transition-all"
              />
              <button
                type="submit"
                className="bg-black text-white px-8 py-4 rounded-2xl font-sans font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-lg shadow-black/20 flex items-center gap-2"
              >
                Send <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-20">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-8">
              <MessageCircle className="w-12 h-12" />
            </div>
            <h3 className="text-3xl font-serif mb-4">Select a conversation</h3>
            <p className="text-gray-400 font-sans font-light max-w-sm">
              Choose a room from the sidebar to start chatting with your customers in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
