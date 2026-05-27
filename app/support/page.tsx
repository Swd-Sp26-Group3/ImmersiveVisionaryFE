"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, MessageSquare, Mail, User, Bot, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";



type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning_details?: unknown; // preserved for multi-turn reasoning continuity
};

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Xin chào! Tôi là trợ lý AI của Immersive Visionary. Tôi có thể giúp gì cho bạn về dịch vụ sản xuất 3D/AR của chúng tôi?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build OpenAI-compatible history, preserving reasoning_details for each assistant turn
      const history = messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        ...(msg.reasoning_details ? { reasoning_details: msg.reasoning_details } : {}),
      }));
      history.push({ role: "user", content: userMessage.content });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate response");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        reasoning_details: data.reasoning_details ?? undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau hoặc sử dụng phương thức liên hệ khác bên dưới.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#1a1f3a] to-[#0f1729] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 mb-6">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="text-sm text-purple-300 font-medium">Hỗ trợ AI cao cấp</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
          Chúng tôi có thể giúp gì?
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Trò chuyện với trợ lý AI thông minh để nhận câu trả lời ngay lập tức, hoặc liên hệ đội ngũ qua Email.
        </p>
      </motion.div>

      <div className="w-full max-w-5xl grid lg:grid-cols-3 gap-8">
        
        {/* Main Chat Interface */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="bg-[#1a1f3a]/80 border-purple-500/20 backdrop-blur-xl h-[600px] flex flex-col shadow-2xl shadow-purple-900/10">
            <CardHeader className="border-b border-purple-500/10 bg-black/20 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    Visionary AI
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-xs">
                    Phản hồi ngay lập tức
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user" 
                        ? "bg-slate-700 text-white" 
                        : "bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
                    }`}>
                      {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    
                    <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-md ${
                      message.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-[#0f1729] text-gray-200 border border-purple-500/10 rounded-tl-sm"
                    }`}>
                      {/* Simple rendering for markdown-like text from Gemini (like bolding) */}
                      {message.content.split('\n').map((line, i) => (
                        <p key={i} className={i !== 0 ? "mt-2" : ""} dangerouslySetInnerHTML={{ 
                          __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                        }} />
                      ))}
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 flex-row"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-[#0f1729] border border-purple-500/10 rounded-2xl rounded-tl-sm px-5 py-3 shadow-md flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </CardContent>

            <div className="p-4 bg-black/20 border-t border-purple-500/10 rounded-b-xl">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn của bạn..."
                  className="w-full bg-[#0f1729] border border-purple-500/30 rounded-full py-3 pl-5 pr-14 text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all placeholder:text-gray-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-full transition-colors"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </Card>
        </motion.div>

        {/* Alternative Contact Methods */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                Hỗ trợ từ con người
              </CardTitle>
              <CardDescription className="text-gray-400">
                Cần giúp đỡ phức tạp hơn? Hãy nói chuyện với đội ngũ thực của chúng tôi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <a href="mailto:khoalen205@gmail.com" className="block">
                <div className="group flex items-center gap-4 p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">Gửi Email</h4>
                    <p className="text-gray-400 text-sm">khoalen205@gmail.com</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                </div>
              </a>

            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border-indigo-500/30 backdrop-blur">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Sẵn sàng 24/7</h3>
              <p className="text-indigo-200/80 text-sm">
                Trợ lý AI hoạt động mọi lúc. Đội ngũ con người thường phản hồi trong 1–2 giờ trong giờ làm việc.
              </p>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
