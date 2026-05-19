"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, MessageSquare, Phone, Mail, User, Bot, Loader2, Sparkles, ChevronRight } from "lucide-react";
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
      content: "Hello! I'm your Immersive Visionary AI Assistant. How can I help you today with our 3D/AR production services?"
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
        content: "Sorry, I'm having trouble connecting right now. Please try again later or use our alternative contact methods below.",
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
          <span className="text-sm text-purple-300 font-medium">Premium AI Support</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
          How can we help you?
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Chat with our intelligent AI assistant for immediate answers, or reach out to our human team via Zalo, WhatsApp, or Email.
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
                    Usually replies instantly
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
                  placeholder="Type your message here..."
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
                Human Support
              </CardTitle>
              <CardDescription className="text-gray-400">
                Need more complex help? Talk to our real human agents directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <a href="https://zalo.me/0900000000" target="_blank" rel="noreferrer" className="block">
                <div className="group flex items-center gap-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <span className="font-bold text-lg">Z</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">Message on Zalo</h4>
                    <p className="text-gray-400 text-sm">+84 9xx xxx xxx</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                </div>
              </a>

              <a href="https://wa.me/84900000000" target="_blank" rel="noreferrer" className="block">
                <div className="group flex items-center gap-4 p-4 rounded-xl border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">WhatsApp</h4>
                    <p className="text-gray-400 text-sm">+84 9xx xxx xxx</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                </div>
              </a>

              <a href="mailto:support@immersivevisionary.com" className="block">
                <div className="group flex items-center gap-4 p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">Email Us</h4>
                    <p className="text-gray-400 text-sm">support@immersive...com</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                </div>
              </a>

            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border-indigo-500/30 backdrop-blur">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Available 24/7</h3>
              <p className="text-indigo-200/80 text-sm">
                Our AI assistant is available around the clock. Human agents usually respond within 1-2 hours during business days.
              </p>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
