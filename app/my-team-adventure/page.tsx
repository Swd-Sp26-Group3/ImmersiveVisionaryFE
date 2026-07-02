"use client";

import { useState } from "react";
import { 
  Facebook, 
  Compass,
  Layers,
  Flame,
  Award,
  Sparkles,
  GitBranch,
  ShieldCheck,
  Zap,
  TrendingUp,
  Activity,
  Cpu,
  Monitor,
  Share2,
  CheckCircle2
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";

const W = "max-w-7xl w-full px-4 sm:px-6 md:px-12 lg:px-8";

export default function MyTeamAdventure() {
  // Post fallbacks
  const [useFb1ImageFallback, setUseFb1ImageFallback] = useState(false);
  const [useTtImageFallback, setUseTtImageFallback] = useState(false);
  const [useFbTextFallback, setUseFbTextFallback] = useState(false);
  const [useFb2ImageFallback, setUseFb2ImageFallback] = useState(false);
  const [useFb3ImageFallback, setUseFb3ImageFallback] = useState(false);

  return (
    <div className="overflow-x-hidden min-h-screen text-slate-100 pb-32 relative" style={{ background: "radial-gradient(circle at 50% 0%, #0c102b 0%, #060714 50%, #030306 100%)" }}>
      
      {/* Dynamic CSS Keyframes */}
      <style>{`
        @keyframes orbit-float-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(30px, -45px) scale(1.1); }
        }
        @keyframes orbit-float-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1.05); }
          50% { transform: translate(-35px, 30px) scale(0.95); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.4; }
          50% { transform: scale(1.08); opacity: 0.7; }
          100% { transform: scale(0.95); opacity: 0.4; }
        }
        .animate-orbit-1 {
          animation: orbit-float-1 14s infinite ease-in-out;
        }
        .animate-orbit-2 {
          animation: orbit-float-2 18s infinite ease-in-out;
        }
        .pulse-node-ring {
          animation: pulse-ring 3s infinite ease-in-out;
        }
      `}</style>

      {/* Grid Overlay decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0" />

      {/* ── HIGH-TECH AMBIENT GLOW ORBS ── */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[180px] animate-orbit-1 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[200px] animate-orbit-2 pointer-events-none" />

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden w-full pt-24 pb-10 z-10">
        <div className={W + " mx-auto text-center relative"}>
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-white/[0.08] backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.1)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-300">
              Immersive Visionary Journey
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-none"
          >
            My Team{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Adventure
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mb-4"
          >
            Bản đồ lộ trình chiến lược ghi lại quá trình phát triển sản phẩm, xây dựng thương hiệu và lan tỏa giá trị công nghệ 3D/WebAR tới cộng đồng.
          </motion.p>
        </div>
      </section>

      {/* ── PROJECT OVERVIEW CONTROL CENTER BANNER ── */}
      <section className="relative z-10 mb-16">
        <div className={W + " mx-auto"}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl border border-white/[0.08] bg-slate-950/45 backdrop-blur-xl p-6 md:p-8 shadow-2xl relative overflow-hidden group hover:border-indigo-500/25 transition-colors duration-500"
          >
            {/* Tech decorative patterns */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-b from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-2 right-4 text-[9px] font-mono text-slate-600 select-none tracking-widest">IMVRS_SYSTEM_v1.0.2</div>
            
            <div className="grid lg:grid-cols-12 gap-6 items-center">
              
              {/* Profile details */}
              <div className="lg:col-span-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 border border-white/10 relative overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xl">
                  <Image src="/imvrs-logo.png" alt="Logo" fill className="object-contain p-2.5" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <h2 className="text-2xl font-black text-white tracking-tight">Immersive Visionaries</h2>
                    <span className="flex items-center gap-1.5 text-[9px] text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 font-black tracking-wider uppercase">
                      <Activity className="w-3 h-3 animate-pulse" /> Live Roadmap
                    </span>
                  </div>
                  
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
                    Chúng tôi phát triển nền tảng quét 3D nhằm đưa vật thể ngoài đời thực vào thế giới số — nhanh hơn, thông minh hơn, trực quan hơn. Dưới đây là các bước đi chiến lược của đội ngũ.
                  </p>
                </div>
              </div>

              {/* Tech Specs Block & Social (Right Side) */}
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4 border-t lg:border-t-0 lg:border-l border-white/[0.08] pt-6 lg:pt-0 lg:pl-6">
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                    <div className="text-slate-500 text-[9px] font-mono uppercase">Lĩnh Vực</div>
                    <div className="text-white text-xs font-bold mt-0.5 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" /> 3D & WebAR
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                    <div className="text-slate-500 text-[9px] font-mono uppercase">Kênh Chính</div>
                    <div className="text-white text-xs font-bold mt-0.5 flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5 text-purple-400" /> FB & TikTok
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 w-full">
                  <a 
                    href="https://www.facebook.com/Immersivis" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg scale-100 hover:scale-[1.02]"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </a>
                  <a 
                    href="https://www.tiktok.com/@immersivevisionary" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition scale-100 hover:scale-[1.02]"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-pink-500">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.95.89 2.22 1.45 3.52 1.62V9.7c-1.78-.17-3.4-.95-4.58-2.27V15c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c.35 0 .69.02 1.03.07V9.7c-1-.28-2.07-.15-2.99.39-.92.54-1.57 1.45-1.8 2.5-.23 1.05-.03 2.16.56 3.07.59.91 1.55 1.51 2.63 1.67.14.02.29.03.44.03 2.45 0 4.45-2 4.45-4.45V0h.24z" />
                    </svg>
                    TikTok
                  </a>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HIGH-TECH SINGLE-COLUMN TIMELINE SECTION ── */}
      <section className="relative z-10">
        <div className={W + " mx-auto"}>
          
          <div className="relative pl-8 sm:pl-16">
            
            {/* Timeline line left-aligned */}
            <div className="absolute left-4 sm:left-8 top-2 bottom-2 w-[2px] bg-gradient-to-b from-purple-500 via-pink-500 via-indigo-500 to-cyan-500 pointer-events-none shadow-[0_0_15px_rgba(99,102,241,0.4)]" />

            {/* ROADMAP STEPS LOOP */}
            <div className="space-y-16">
              
              {/* ── PHASE 01: FACEBOOK PAGE LAUNCH ── */}
              <div className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-8 sm:-left-16 -translate-x-[15px] top-10 flex items-center justify-center z-20">
                  <span className="absolute w-8 h-8 rounded-full bg-purple-500/20 pulse-node-ring" />
                  <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.6)] group-hover:scale-110 group-hover:border-purple-400 transition-all duration-300">
                    <Compass className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                </div>

                {/* Symmetrical Card internally split */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className="rounded-3xl border border-white/[0.08] bg-slate-950/50 backdrop-blur-md p-6 sm:p-8 shadow-2xl relative hover:border-purple-500/35 hover:shadow-[0_0_50px_rgba(168,85,247,0.1)] transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-transparent" />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    
                    {/* Left: Text detail column */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-md font-mono font-black tracking-wider uppercase">
                          PHASE 01: INITIATION
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-purple-400 font-semibold bg-purple-500/5 px-2 py-0.5 rounded-full border border-purple-500/10">
                          <GitBranch className="w-3.5 h-3.5" /> Giai đoạn Khởi tạo
                        </span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                        Ra Mắt Kênh Facebook Chính Thức & Giới Thiệu Giải Pháp 3D/WebAR
                      </h3>

                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                        Chính thức thành lập trang cộng đồng và truyền đi thông điệp đầu tiên giới thiệu về giải pháp WebAR & 3D quét vật thể thực tế vào không gian số.
                      </p>

                      {/* Key Results list */}
                      <div className="space-y-2 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                        <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-bold">KẾT QUẢ ĐẠT ĐƯỢC:</div>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            <span>Thiết lập bộ nhận diện thương hiệu số</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            <span>Tiếp cận 3D & WebAR lần đầu trên nền tảng Facebook</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Right: Mockup Media column */}
                    <div className="lg:col-span-7">
                      <div className="rounded-2xl overflow-hidden border border-white/10 relative bg-slate-950 flex flex-col group/media shadow-2xl">
                        <div className="bg-slate-900/80 px-4 py-2 border-b border-white/[0.08] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
                          <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
                          <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
                          <span className="text-[9px] text-slate-500 font-mono ml-2">facebook_launch.png</span>
                        </div>

                        {!useFb1ImageFallback ? (
                          <div className="relative w-full h-[240px] sm:h-[300px] md:h-[340px] bg-slate-950 overflow-hidden">
                            <img 
                              src="/media__1783017230490.png" 
                              alt="Facebook Page Intro"
                              className="w-full h-full object-contain group-hover/media:scale-[1.02] transition-transform duration-500"
                              onError={() => setUseFb1ImageFallback(true)}
                            />
                          </div>
                        ) : (
                          <div className="w-full p-6 relative flex flex-col justify-center items-center text-center bg-slate-900/60 min-h-[220px]">
                            <h4 className="text-sm font-bold text-white mb-2">TRẢI NGHIỆM SẢN PHẨM HOÀN TOÀN MỚI!</h4>
                            <p className="text-xs text-slate-400 max-w-md">3D & WebAR hỗ trợ quan sát sản phẩm trực quan, tăng tương tác và trải nghiệm mua sắm.</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </motion.div>
              </div>

              {/* ── PHASE 02: TIKTOK WELCOME POST ── */}
              <div className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-8 sm:-left-16 -translate-x-[15px] top-10 flex items-center justify-center z-20">
                  <span className="absolute w-8 h-8 rounded-full bg-pink-500/20 pulse-node-ring" />
                  <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-pink-500 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.6)] group-hover:scale-110 group-hover:border-pink-400 transition-all duration-300">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  </div>
                </div>

                {/* Symmetrical Card internally split */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className="rounded-3xl border border-white/[0.08] bg-slate-950/50 backdrop-blur-md p-6 sm:p-8 shadow-2xl relative hover:border-pink-500/35 hover:shadow-[0_0_50px_rgba(236,72,153,0.1)] transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 to-transparent" />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    
                    {/* Left: Text detail column */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2.5 py-0.5 rounded-md font-mono font-black tracking-wider uppercase">
                          PHASE 02: ENGAGEMENT
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-pink-400 font-semibold bg-pink-500/5 px-2 py-0.5 rounded-full border border-pink-500/10">
                          <Zap className="w-3.5 h-3.5" /> Giai đoạn Gắn kết
                        </span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                        Chào Mừng Cộng Đồng Trên Kênh TikTok
                      </h3>

                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                        Mở rộng sang không gian truyền thông video ngắn, tập trung tiếp cận tệp khách hàng tiềm năng thế hệ mới thông qua các trải nghiệm tương tác AR trực quan.
                      </p>

                      {/* Key Results list */}
                      <div className="space-y-2 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                        <div className="text-[10px] font-mono text-pink-400 uppercase tracking-widest font-bold">KẾT QUẢ ĐẠT ĐƯỢC:</div>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                            <span>Mở rộng tệp tiếp cận bằng định dạng video ngắn</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                            <span>Chạm mốc những tương tác trực quan đầu tiên</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Right: Mockup Media column */}
                    <div className="lg:col-span-7">
                      <div className="rounded-2xl overflow-hidden border border-white/10 relative bg-slate-950 flex flex-col group/media shadow-2xl">
                        <div className="bg-slate-900/80 px-4 py-2 border-b border-white/[0.08] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
                          <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
                          <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
                          <span className="text-[9px] text-slate-500 font-mono ml-2">tiktok_welcome.png</span>
                        </div>

                        {!useTtImageFallback ? (
                          <div className="relative w-full h-[240px] sm:h-[300px] md:h-[340px] bg-slate-950 overflow-hidden">
                            <img 
                              src="/media__1783017412770.png" 
                              alt="TikTok Welcome"
                              className="w-full h-full object-contain group-hover/media:scale-[1.02] transition-transform duration-500"
                              onError={() => setUseTtImageFallback(true)}
                            />
                          </div>
                        ) : (
                          <div className="p-6 relative flex flex-col justify-center items-center text-center bg-slate-900/60 min-h-[220px]">
                            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/15 flex items-center justify-center p-1 mb-2">
                              <Image src="/imvrs-logo.png" alt="Logo" width={24} height={24} className="object-contain" />
                            </div>
                            <h4 className="text-sm font-bold text-white uppercase mb-1">TRẢI NGHIỆM NGAY!</h4>
                            <span className="text-[10px] text-cyan-400 font-mono">immersivevisionary.name.vn</span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </motion.div>
              </div>

              {/* ── PHASE 03: FACEBOOK COMMUNITY WELCOME ── */}
              <div className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-8 sm:-left-16 -translate-x-[15px] top-10 flex items-center justify-center z-20">
                  <span className="absolute w-8 h-8 rounded-full bg-indigo-500/20 pulse-node-ring" />
                  <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.6)] group-hover:scale-110 group-hover:border-indigo-400 transition-all duration-300">
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                </div>

                {/* Symmetrical Card internally split */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className="rounded-3xl border border-white/[0.08] bg-slate-950/50 backdrop-blur-md p-6 sm:p-8 shadow-2xl relative hover:border-indigo-500/35 hover:shadow-[0_0_50px_rgba(99,102,241,0.1)] transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-transparent" />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    
                    {/* Left: Text detail column */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-md font-mono font-black tracking-wider uppercase">
                          PHASE 03: COMMUNITY
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-semibold bg-indigo-500/5 px-2 py-0.5 rounded-full border border-indigo-500/10">
                          <Share2 className="w-3.5 h-3.5" /> Giai đoạn Cộng đồng
                        </span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                        Ra Mắt Cộng Đồng Công Nghệ 3D & AR Đầu Tiên
                      </h3>

                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                        Công bộ bài đăng chào mừng cộng đồng 3D & AR, chia sẻ định hướng mang lại các bài viết kiến thức chuyên sâu và giải pháp kỹ thuật số tối ưu cho mọi doanh nghiệp.
                      </p>

                      {/* Key Results list */}
                      <div className="space-y-2 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                        <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">KẾT QUẢ ĐẠT ĐƯỢC:</div>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            <span>Hé lộ thông tin về dự án giải pháp 3D chất lượng cao</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            <span>Gia tăng lượng tương tác tự nhiên từ những người yêu công nghệ</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Right: Mockup Media column */}
                    <div className="lg:col-span-7">
                      <div className="rounded-2xl overflow-hidden border border-white/10 relative bg-slate-950 flex flex-col group/media shadow-2xl">
                        <div className="bg-slate-900/80 px-4 py-2 border-b border-white/[0.08] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
                          <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
                          <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
                          <span className="text-[9px] text-slate-500 font-mono ml-2">facebook_community.png</span>
                        </div>

                        {!useFbTextFallback ? (
                          <div className="relative w-full h-[240px] sm:h-[300px] md:h-[340px] bg-slate-950 overflow-hidden">
                            <img 
                              src="/media__1783020264165.png" 
                              alt="Facebook Community Welcome"
                              className="w-full h-full object-contain group-hover/media:scale-[1.02] transition-transform duration-500"
                              onError={() => setUseFbTextFallback(true)}
                            />
                          </div>
                        ) : (
                          <div className="w-full p-6 relative flex flex-col justify-center items-center text-center bg-slate-900/60 min-h-[220px]">
                            <h4 className="text-sm font-bold text-white mb-2">CHÀO MỪNG ĐẾN VỚI CỘNG ĐỒNG 3D & AR!</h4>
                            <p className="text-xs text-slate-400 max-w-md">Nơi kết nối và cập nhật những kiến thức, xu hướng và dự án sáng tạo đột phá từ Immersive Visionary.</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </motion.div>
              </div>

              {/* ── PHASE 04: FACEBOOK FUN FACT ── */}
              <div className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-8 sm:-left-16 -translate-x-[15px] top-10 flex items-center justify-center z-20">
                  <span className="absolute w-8 h-8 rounded-full bg-cyan-500/20 pulse-node-ring" />
                  <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.6)] group-hover:scale-110 group-hover:border-cyan-300 transition-all duration-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                </div>

                {/* Symmetrical Card internally split */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className="rounded-3xl border border-white/[0.08] bg-slate-950/50 backdrop-blur-md p-6 sm:p-8 shadow-2xl relative hover:border-cyan-500/35 hover:shadow-[0_0_50px_rgba(34,211,238,0.1)] transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-transparent" />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    
                    {/* Left: Text detail column */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-md font-mono font-black tracking-wider uppercase">
                          PHASE 04: EDUCATION
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-semibold bg-cyan-500/5 px-2 py-0.5 rounded-full border border-cyan-500/10">
                          <Layers className="w-3.5 h-3.5" /> Giai đoạn Phổ cập
                        </span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                        Lan Tỏa Tri Thức: Phát Động Chiến Dịch 3D Fun Fact #01
                      </h3>

                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                        Chia sẻ kiến thức khoa học trực quan về mức độ nhạy cảm hình ảnh của não bộ, qua đó phân tích tiềm năng thúc đẩy doanh số vượt trội nhờ ứng dụng mô hình 3D.
                      </p>

                      {/* Key Results list */}
                      <div className="space-y-2 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                        <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">KẾT QUẢ ĐẠT ĐƯỢC:</div>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            <span>Chia sẻ lý thuyết khoa học não bộ trực quan</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            <span>Lồng ghép tầm nhìn ứng dụng thực tế ảo vào thương mại điện tử</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Right: Mockup Media column */}
                    <div className="lg:col-span-7">
                      <div className="rounded-2xl overflow-hidden border border-indigo-500/20 relative bg-slate-950 flex flex-col group/media shadow-2xl">
                        <div className="bg-slate-900/80 px-4 py-2 border-b border-white/[0.08] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
                          <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
                          <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
                          <span className="text-[9px] text-slate-500 font-mono ml-2">funfact_01.png</span>
                        </div>

                      {!useFb2ImageFallback ? (
                        <div className="relative w-full h-[240px] sm:h-[300px] md:h-[340px] bg-slate-950 overflow-hidden">
                          <img 
                            src="/media__1783017191917.png" 
                            alt="Facebook Fun Fact #01"
                            className="w-full h-full object-contain group-hover/media:scale-[1.02] transition-transform duration-500"
                            onError={() => setUseFb2ImageFallback(true)}
                          />
                        </div>
                      ) : (
                        <div className="w-full p-6 relative flex flex-col justify-center items-center text-center bg-slate-900/60 min-h-[220px]">
                          <h4 className="text-sm font-bold text-white mb-2">NÃO BỘ THÍCH HÌNH ẢNH HƠN BẠN NGHĨ!</h4>
                          <p className="text-xs text-slate-400 max-w-md">Hãy nâng cao trải nghiệm mua sắm bằng cách tương tác sản phẩm 3D xoay 360 độ và WebAR trực tiếp.</p>
                        </div>
                      )}
                      </div>
                    </div>

                  </div>
                </motion.div>
              </div>

              {/* ── PHASE 05: WORKFLOW CAMPAIGN ── */}
              <div className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-8 sm:-left-16 -translate-x-[15px] top-10 flex items-center justify-center z-20">
                  <span className="absolute w-8 h-8 rounded-full bg-emerald-500/20 pulse-node-ring" />
                  <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.6)] group-hover:scale-110 group-hover:border-emerald-400 transition-all duration-300">
                    <Flame className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>

                {/* Symmetrical Card internally split */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className="rounded-3xl border border-white/[0.08] bg-slate-950/50 backdrop-blur-md p-6 sm:p-8 shadow-2xl relative hover:border-emerald-500/35 hover:shadow-[0_0_50px_rgba(16,185,129,0.1)] transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-transparent" />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    
                    {/* Left: Text detail column */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md font-mono font-black tracking-wider uppercase">
                          PHASE 05: ACTION
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
                          <TrendingUp className="w-3.5 h-3.5" /> Giai đoạn Hành động
                        </span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                        Phát Động Chiến Dịch "Vượt Giới Hạn Của Ảnh Chụp"
                      </h3>

                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                        Bài viết chia sẻ tầm nhìn đưa sản phẩm vào thế giới thực tế ảo và giới thiệu quy trình làm việc 3D tinh gọn (từ tiếp nhận yêu cầu, sản xuất mô hình, đánh giá & duyệt cho đến khi nhận thành phẩm).
                      </p>

                      {/* Key Results list */}
                      <div className="space-y-2 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                        <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">KẾT QUẢ ĐẠT ĐƯỢC:</div>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>Chiến dịch nâng tầm hình ảnh thực tế ảo 3D</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>Công bố quy trình 4 bước tinh gọn tới khách hàng B2B</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Right: Mockup Media column */}
                    <div className="lg:col-span-7">
                      <div className="rounded-2xl overflow-hidden border border-white/10 relative bg-slate-950 flex flex-col group/media shadow-2xl">
                        <div className="bg-slate-900/80 px-4 py-2 border-b border-white/[0.08] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
                          <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
                          <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
                          <span className="text-[9px] text-slate-500 font-mono ml-2">workflow_campaign.png</span>
                        </div>

                      {!useFb3ImageFallback ? (
                        <div className="relative w-full h-[240px] sm:h-[300px] md:h-[340px] bg-slate-950 overflow-hidden">
                          <img 
                            src="/media__1783020246266.png" 
                            alt="Facebook Workflow Campaign"
                            className="w-full h-full object-contain group-hover/media:scale-[1.02] transition-transform duration-500"
                            onError={() => setUseFb3ImageFallback(true)}
                          />
                        </div>
                      ) : (
                        <div className="w-full p-6 relative flex flex-col justify-center items-center text-center bg-slate-900/60 min-h-[220px]">
                          <h4 className="text-sm font-bold text-white mb-2">ĐƯA SẢN PHẨM VÀO THẾ GIỚI THỰC TẾ ẢO</h4>
                          <p className="text-xs text-slate-400 max-w-md">Quy trình làm việc chuyên nghiệp, tinh gọn mang lại mô hình 3D và WebAR chất lượng cao nhất cho sản phẩm của bạn.</p>
                        </div>
                      )}
                      </div>
                    </div>

                  </div>
                </motion.div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="mt-28 z-10 relative">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-3xl p-8 md:p-12 text-center relative overflow-hidden border border-white/10 shadow-[0_15px_40px_rgba(99,102,241,0.15)] hover:border-indigo-500/25 transition duration-500" style={{ background: "linear-gradient(135deg, #120e36 0%, #08061a 100%)" }}>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
            
            {/* Animated floating sparkles */}
            <div className="absolute top-6 left-12 w-6 h-6 text-purple-400/40 animate-bounce" />
            <div className="absolute bottom-6 right-12 w-6 h-6 text-indigo-400/40 animate-bounce" style={{ animationDelay: "1s" }} />

            <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
              Theo Dõi Hành Trình Của Chúng Tôi!
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto mb-8 leading-relaxed">
              Hãy kết nối với chúng tôi qua các kênh truyền thông chính thức để không bỏ lỡ các thông tin bổ ích và bước phát triển tiếp theo của dự án.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="https://www.facebook.com/Immersivis" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-blue-600/30 scale-100 hover:scale-[1.03]"
              >
                <Facebook className="w-4 h-4" />
                <span>Trang Facebook</span>
              </a>
              <a 
                href="https://www.tiktok.com/@immersivevisionary" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 py-3 px-6 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-pink-600/30 scale-100 hover:scale-[1.03]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.95.89 2.22 1.45 3.52 1.62V9.7c-1.78-.17-3.4-.95-4.58-2.27V15c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c.35 0 .69.02 1.03.07V9.7c-1-.28-2.07-.15-2.99.39-.92.54-1.57 1.45-1.8 2.5-.23 1.05-.03 2.16.56 3.07.59.91 1.55 1.51 2.63 1.67.14.02.29.03.44.03 2.45 0 4.45-2 4.45-4.45V0h.24z" />
                </svg>
                <span>Kênh TikTok</span>
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
