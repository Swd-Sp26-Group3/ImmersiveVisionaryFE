"use client";
import { useState, useEffect } from "react";
import {
  ArrowRight, Box, CheckCircle2, Layers, Palette, Wand2, Eye, Download,
  Sparkles, Cpu, ShieldCheck, Zap, ChevronDown, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import TVModelViewer from "../components/3d/TVModelViewer";
import { ARQRButton } from "../components/3d/ARQRButton";
import { apiFetch } from "@/lib/api";

const W = "max-w-7xl w-full px-4 sm:px-6 md:px-12 lg:px-8";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [appOrigin, setAppOrigin] = useState("");
  const [marketplaceCount, setMarketplaceCount] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => { 
    setAppOrigin(window.location.origin); 
    
    // Dynamically fetch marketplace assets count
    apiFetch("/assets/marketplace")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        const list = data.data ?? data;
        if (Array.isArray(list)) {
          setMarketplaceCount(list.length);
        }
      })
      .catch((err) => console.warn("Failed to fetch marketplace count:", err));
  }, []);

  const handleNav = (destination: string) => {
    router.push(isAuthenticated ? destination : "/login");
  };

  const stats = [
    { value: marketplaceCount > 0 ? `${marketplaceCount}+` : "15+", label: "Mô hình 3D sẵn có", detail: "Cập nhật thời gian thực" },
    { value: "24h", label: "Hủy đơn & Hoàn tiền", detail: "Đổi ý miễn phí trong 24h" },
    { value: "100%", label: "Tương thích Web/AR", detail: "Không cần cài app" },
  ];

  const services = [
    {
      icon: <Box className="w-6 h-6 text-cyan-400" />,
      title: "Sản phẩm có sẵn",
      description: "Duyệt và mua các tệp quảng cáo 3D/AR chất lượng cao được thiết kế sẵn. Tải xuống ngay lập tức.",
      cta: "Khám phá Marketplace",
      link: "/marketplace",
      gradient: "from-cyan-500/10 to-blue-500/5",
    },
    {
      icon: <Palette className="w-6 h-6 text-purple-400" />,
      title: "Đặt hàng theo ý tưởng",
      description: "Đặt sản xuất các ý tưởng 3D độc quyền. Tối ưu hóa chi phí và đảm bảo thời gian giao hàng sớm.",
      cta: "Bắt đầu thiết kế",
      link: "/order",
      gradient: "from-purple-500/10 to-indigo-500/5",
    },
    {
      icon: <Layers className="w-6 h-6 text-indigo-400" />,
      title: "Sản xuất theo yêu cầu",
      description: "Dịch vụ dựng hình 3D/AR toàn diện theo mẫu sản phẩm thật. Đảm bảo độ sắc nét và tỷ lệ 1:1 chuẩn xác.",
      cta: "Yêu cầu báo giá",
      link: "/support",
      gradient: "from-indigo-500/10 to-pink-500/5",
    },
  ].filter(s => !(s.link === "/marketplace" && isAuthenticated && (user?.role === "MANAGER" || user?.role === "ADMIN")));

  const pipelineSteps = [
    { step: "01", title: "Gửi yêu cầu", desc: "Mô tả ý tưởng, điền brief, đính kèm hình ảnh tham khảo và chọn gói dịch vụ.", icon: <MessageSquare className="w-5 h-5" /> },
    { step: "02", title: "Sản xuất 3D", desc: "Quản lý bàn giao cho Nghệ sĩ 3D chuyên nghiệp dựng hình chi tiết và tối ưu hóa.", icon: <Wand2 className="w-5 h-5" /> },
    { step: "03", title: "Đánh giá & Duyệt", desc: "Khách hàng trực tiếp xoay/zoom xem trước mô hình 3D tương tác trên Web và phản hồi.", icon: <Eye className="w-5 h-5" /> },
    { step: "04", title: "Nhận tệp & AR", desc: "Hoàn tất thanh toán hóa đơn để tải xuống tệp nguồn và mã QR xem AR trên di động.", icon: <Download className="w-5 h-5" /> },
  ];

  const advantages = [
    { icon: <Cpu className="w-5 h-5 text-cyan-400" />, title: "Hiệu năng mượt mà", desc: "Mô hình được tối ưu số lượng đa giác (polycount) và nén texture giúp hiển thị mượt mà trên mọi trình duyệt di động." },
    { icon: <Sparkles className="w-5 h-5 text-purple-400" />, title: "Chất liệu siêu thực", desc: "Ứng dụng chuẩn vật liệu PBR (Physically Based Rendering) cho độ phản quang kim loại và độ trong suốt hoàn hảo." },
    { icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />, title: "Bảo mật tệp nguồn", desc: "Lưu trữ đám mây an toàn, tải xuống định dạng .gltf, .obj, .blend, .fbx linh hoạt với quyền sở hữu vĩnh viễn." },
    { icon: <Zap className="w-5 h-5 text-pink-400" />, title: "Trải nghiệm tức thì", desc: "Tính năng WebAR đột phá, quét mã QR khởi chạy camera xem mô hình trực tiếp tại chỗ không cần cài ứng dụng thứ ba." },
  ];

  const faqs = [
    { q: "Quy trình sản xuất từ lúc đặt đến lúc nhận tệp mất bao lâu?", a: "Thời gian hoàn thành phụ thuộc vào gói thời hạn bạn chọn khi tạo yêu cầu. Gói Standard từ 7-10 ngày, Express từ 3-5 ngày, và gói Rush hỗ trợ hoàn thiện cực nhanh trong vòng 1-2 ngày." },
    { q: "Tôi có thể xem thử sản phẩm trước khi thanh toán không?", a: "Hoàn toàn được. Sau khi nghệ sĩ hoàn thiện sản phẩm nháp, trạng thái đơn hàng chuyển sang 'Đánh giá'. Bạn có thể xoay, phóng to, thu nhỏ mô hình trực quan ngay trên trình duyệt và phản hồi yêu cầu chỉnh sửa trước khi thanh toán nhận file." },
    { q: "Chính sách hủy đơn và hoàn tiền hoạt động như thế nào?", a: "Immersive Visionary hỗ trợ hủy đơn hàng linh hoạt trong vòng 24 giờ kể từ lúc tạo yêu cầu. Sau 24 giờ, nếu Artist chưa được chỉ định sản xuất, bạn vẫn có thể hủy đơn và được hoàn tiền." },
    { q: "Các định dạng tệp 3D nào sẽ được bàn giao?", a: "Chúng tôi bàn giao đầy đủ các tệp định dạng chuẩn bao gồm GLB/GLTF (cho AR/Web), OBJ/FBX (tương thích các phần mềm đồ họa), và tệp nguồn gốc Blender (.blend) kèm toàn bộ bản đồ chất liệu (texture maps)." }
  ];

  const partners = ["Neomodel", "AR-Studio", "Visionary", "Nexus 3D", "FutureSpace"];

  return (
    <div className="overflow-x-hidden min-h-screen text-slate-100" style={{ background: "radial-gradient(circle at 50% 0%, #0d1530 0%, #070913 60%, #050508 100%)" }}>

      {/* Grid Overlay decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden w-full flex items-center pt-8 md:pt-16 pb-20 md:pb-28 z-10">
        
        {/* Ambient Glows */}
        <div className="absolute top-20 right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-[-5%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className={W + " mx-auto"}>
          <div className="grid lg:grid-cols-[1fr_1.25fr] gap-12 lg:gap-16 items-center w-full">

            {/* Left Column - Headline and CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col justify-center relative z-10"
            >
              {/* Badge */}
              <div className="inline-flex items-center self-start gap-2.5 px-3 py-1 rounded-full mb-8 bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-300">
                  Nền tảng sản xuất 3D & AR tương tác
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
                Đưa sản phẩm của bạn vào thế giới{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  Thực tế ảo
                </span>
              </h1>

              {/* Desc */}
              <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-10 max-w-xl">
                Giải pháp toàn diện thiết kế mô hình 3D chuẩn hóa và tích hợp WebAR chuyên nghiệp. Giúp tăng tỷ lệ chuyển đổi bán hàng và nâng cấp nhận diện thương hiệu số của bạn.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-16">
                <Button
                  onClick={() => handleNav("/order")}
                  size="lg"
                  className="text-white font-bold px-8 py-6 rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-[0_4px_30px_rgba(99,102,241,0.35)]"
                >
                  Bắt đầu dự án tùy chỉnh
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                {!(isAuthenticated && (user?.role === "MANAGER" || user?.role === "ADMIN")) && (
                  <Link href="/marketplace">
                    <Button
                      size="lg"
                      variant="outline"
                      className="font-bold px-8 py-6 rounded-xl border-white/10 hover:border-indigo-500/40 text-white bg-slate-900/40 backdrop-blur-md hover:bg-indigo-500/5 transition-all duration-300"
                    >
                      Duyệt mẫu có sẵn
                    </Button>
                  </Link>
                )}
              </div>

              {/* Dynamic Stats Row */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/[0.06] bg-slate-950/20 backdrop-blur-sm rounded-2xl p-4 border border-white/[0.04]">
                {stats.map((s, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-2xl sm:text-3xl font-black text-white bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                      {s.value}
                    </span>
                    <span className="text-xs font-bold text-indigo-300 mt-1">{s.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{s.detail}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Column - Holographic 3D display screen */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="relative w-full h-[520px] lg:h-[640px] flex items-stretch"
            >
              {/* Floating tech cards decoration */}
              <div className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-2xl animate-bounce" style={{ animationDuration: "3s" }}>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">3D Real-time Live</span>
              </div>

              {/* Glowing ring behind viewer */}
              <div className="absolute w-[80%] h-[80%] rounded-full bg-indigo-500/5 border border-indigo-500/10 blur-xl animate-pulse" />

              {/* Screen container */}
              <div className="w-full h-full rounded-3xl overflow-hidden bg-slate-900/20 border border-white/[0.08] backdrop-blur-sm relative flex flex-col p-2 shadow-2xl shadow-indigo-900/20">
                {/* 3D Canvas body */}
                <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-950/60">
                  <TVModelViewer
                    className="w-full h-full bg-transparent border-0 rounded-none shadow-none"
                    bloomStrength={0.15}
                  />

                  {/* QR & AR Button overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 z-10">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 backdrop-blur-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">WebAR Sẵn sàng</span>
                    </div>
                    {appOrigin && (
                      <ARQRButton
                        modelUrl={`${appOrigin}/tv.gltf`}
                        label="TV Hologram — Immersive Visionary"
                      />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── CLIENT PARTNERS ── */}
      <section className="py-8 border-y border-white/[0.05] bg-slate-950/40 relative z-10">
        <div className={W + " mx-auto"}>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:opacity-70 transition-opacity duration-300">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-4">Trusted by creators at</span>
            {partners.map((p, i) => (
              <span key={i} className="text-sm font-black tracking-widest font-mono text-white">
                {p.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICE SECTIONS ── */}
      <section className="py-20 md:py-28 relative z-10">
        <div className={W + " mx-auto"}>
          
          <div className="flex flex-col items-center text-center mb-16">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Mô hình hoạt động</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Khám phá các dịch vụ 3D/AR
            </h2>
            <div className="w-12 h-1 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded mt-4 mb-5" />
            <p className="text-slate-400 text-sm md:text-base max-w-xl leading-relaxed">
              Giải quyết mọi nhu cầu trình diễn hình ảnh 3D từ các mẫu có sẵn chất lượng cao đến sản xuất tùy biến theo thương hiệu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((svc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`rounded-2xl p-8 md:p-10 flex flex-col justify-between min-h-[350px] relative overflow-hidden border border-white/[0.06] hover:border-indigo-500/40 transition-all duration-300 group hover:shadow-xl hover:shadow-indigo-500/5 bg-gradient-to-b ${svc.gradient} to-transparent`}
              >
                {/* Accent glow on hover */}
                <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/[0.02] transition-colors duration-300 pointer-events-none" />

                <div className="space-y-6">
                  {/* Icon wrap */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-900 border border-white/10 group-hover:border-indigo-500/30 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {svc.icon}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {svc.title}
                  </h3>

                  <p className="text-slate-400 text-sm leading-relaxed">
                    {svc.description}
                  </p>
                </div>

                <div className="pt-8 mt-auto border-t border-white/[0.04]">
                  <Link
                    href={svc.link}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition group"
                  >
                    {svc.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── CORE ADVANTAGES (NỔI BẬT) ── */}
      <section className="py-20 md:py-24 border-t border-white/[0.05] bg-slate-950/20 relative z-10">
        <div className={W + " mx-auto"}>
          
          <div className="grid lg:grid-cols-[1fr_1.8fr] gap-12 lg:gap-16 items-center">
            
            {/* Left label and title */}
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 block">Tại sao chọn chúng tôi?</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 leading-tight">
                Ưu thế công nghệ vượt trội của Immersive Visionary
              </h2>
              <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-indigo-500 rounded mb-6" />
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Được tinh chỉnh bởi đội ngũ kỹ sư 3D chuyên nghiệp, chúng tôi cam kết chất lượng hiển thị chuẩn xác nhất và tích hợp nhanh chóng nhất vào website bán hàng của bạn.
              </p>
            </div>

            {/* Right advantages grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {advantages.map((adv, i) => (
                <div key={i} className="p-6 rounded-2xl border border-white/[0.04] bg-slate-900/30 backdrop-blur-sm hover:border-white/[0.08] transition duration-300">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-4">
                    {adv.icon}
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{adv.title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{adv.desc}</p>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* ── PRODUCTION WORKFLOW (CONNECTING TIMELINE) ── */}
      <section className="py-20 md:py-28 border-t border-white/[0.05] relative z-10">
        <div className={W + " mx-auto"}>
          
          <div className="flex flex-col items-center text-center mb-16">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Quy trình chuyên nghiệp</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Các bước làm việc tinh gọn
            </h2>
            <div className="w-12 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded mt-4" />
          </div>

          {/* Connected timeline steps */}
          <div className="relative">
            {/* Connecting line (Desktop only) */}
            <div className="absolute top-[24px] left-[12.5%] right-[12.5%] h-[3px] hidden lg:block pointer-events-none z-0">
              {/* Outer Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 blur-[4px] opacity-70" />
              {/* Inner Line */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 rounded-full" />
              {/* Glowing animated runner */}
              <motion.div
                className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
                initial={{ left: "-10%" }}
                animate={{ left: "110%" }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* Grid Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {pipelineSteps.map((item, i) => (
                <div key={i} className="flex flex-col items-center group">
                  {/* Icon Circle (floats above card) */}
                  <div className="w-12 h-12 rounded-full bg-slate-950 border border-white/15 flex items-center justify-center text-slate-300 transition duration-500 shadow-lg group-hover:border-cyan-400/50 group-hover:text-cyan-400 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] relative z-20 mb-6">
                    {item.icon}
                  </div>

                  {/* Card Container */}
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="w-full rounded-2xl p-6 bg-slate-950/40 border border-white/[0.06] hover:bg-slate-900/30 hover:border-cyan-500/20 transition-all duration-300 relative text-center"
                  >
                    <span className="text-[10px] font-black font-mono text-white/20 group-hover:text-cyan-400/40 transition duration-300 block mb-2 uppercase tracking-wider">
                      Stage {item.step}
                    </span>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {item.desc}
                    </p>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── INTERACTIVE FAQ SECTION ── */}
      <section className="py-20 md:py-24 border-t border-white/[0.05] bg-slate-950/20 relative z-10">
        <div className={W + " mx-auto max-w-4xl"}>
          
          <div className="flex flex-col items-center text-center mb-16">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Giải đáp thắc mắc</span>
            <h2 className="text-3xl font-extrabold text-white">
              Câu hỏi thường gặp
            </h2>
            <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-indigo-500 rounded mt-4" />
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/[0.06] bg-slate-950/50 backdrop-blur-sm overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-white hover:text-indigo-300 transition duration-300"
                  >
                    <span className="text-sm md:text-base pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180 text-indigo-400" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-6 text-slate-400 text-xs md:text-sm leading-relaxed border-t border-white/[0.03] pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── CALL-TO-ACTION (CTA) ── */}
      <section className="py-24 relative z-10">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
          <div
            className="text-center rounded-3xl px-8 py-16 md:py-24 w-full relative overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(99,102,241,0.2)]"
            style={{
              background: "linear-gradient(135deg, #1b124a 0%, #0c0828 100%)",
            }}
          >
            {/* Tech grid mesh in CTA banner */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
            <div className="absolute top-[-50%] left-[-20%] w-[60%] h-[100%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-50%] right-[-20%] w-[60%] h-[100%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: "1s" }} />

            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                Sẵn sàng nâng tầm sản phẩm của bạn?
              </h2>

              <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
                Cùng chúng tôi tạo nên những trải nghiệm mua sắm thực tế ảo (AR) độc đáo, giúp khách hàng thấu hiểu sản phẩm của bạn hơn bao giờ hết.
              </p>

              <div className="pt-4">
                <Button
                  onClick={() => handleNav("/support")}
                  size="lg"
                  className="font-bold px-10 py-6 text-sm md:text-base hover:scale-[1.03] transition bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl shadow-[0_4px_30px_rgba(6,182,212,0.3)]"
                >
                  Khởi tạo dự án ngay hôm nay
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}