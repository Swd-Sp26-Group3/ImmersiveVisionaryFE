"use client";
import { ArrowRight, Box, CheckCircle2, Layers, Palette } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const W = "max-w-8xl w-full md:px-12 lg:px-20";

export default function HomePage() {
  const {isAuthenticated} = useAuth();
  const router = useRouter();
  
  const handleNav = (destination: string) => {
    router.push(isAuthenticated ? destination : "/login");
  };

  const stats = [
    { value: "500+", label: "Projects Completed" },
    { value: "98%", label: "Client Satisfaction" },
    { value: "48h", label: "Average Delivery" },
  ];

  const services = [
    {
      icon: <Box className="w-6 h-6" />,
      title: "Ready-Made Assets",
      description: "Browse and purchase pre-made 3D/AR advertising files. Instant download, ready to deploy.",
      cta: "Browse Marketplace",
      link: "/marketplace",
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Pre-Order Concepts",
      description: "Reserve upcoming 3D content during concept stage. Early access pricing and priority delivery.",
      cta: "Transfer Your Ideas into 3D Content",
      link: "/order",
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Custom Production",
      description: "Full-service 3D/AR production from your physical products. Photography to final AR-ready files.",
      cta: "Start Project",
      link: "/studio-custom",
    },
  ];

  const pipelineSteps = [
    { step: "01", title: "Submit Brief", desc: "Share product details and requirements" },
    { step: "02", title: "Photography", desc: "Professional product photography session" },
    { step: "03", title: "3D Modeling", desc: "Expert artists create photorealistic models" },
    { step: "04", title: "AR Integration", desc: "Optimize for web and mobile AR" },
  ];

  return (
    <div className="overflow-x-hidden" style={{ background: "#090d1f" }}>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden w-full" style={{ minHeight: "92vh" }}>
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 80% at 75% 50%, rgba(88,28,220,0.2) 0%, rgba(79,70,229,0.07) 50%, transparent 75%)",
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 35% 45% at 73% 42%, rgba(168,85,247,0.15) 0%, transparent 60%)",
        }} />

        <div className={W + " relative"} style={{ minHeight: "92vh", display: "flex", alignItems: "center" }}>
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full py-20">

            {/* Left – Text content */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="flex flex-col justify-center"
            >
              {/* Badge */}
              <div
                className="inline-flex items-center self-start gap-2 px-3 py-1.5 rounded-md mb-8"
                style={{
                  background: "rgba(79,70,229,0.15)",
                  border: "1px solid rgba(99,102,241,0.35)",
                }}
              >
                <span className="text-xs font-medium" style={{ color: "#a5b4fc" }}>
                  Professional 3D/AR Production
                </span>
              </div>

              {/* Heading */}
              <h1
                className="font-extrabold text-white mb-6"
                style={{ fontSize: "clamp(2.2rem, 4vw, 3.8rem)", lineHeight: 1.1 }}
              >
                Transform Products into{" "}
                <br />
                Immersive Experiences
              </h1>

              {/* Description */}
              <p className="text-base leading-relaxed mb-10" style={{ color: "#94a3b8", maxWidth: "460px" }}>
                Enterprise-grade 3D modeling and AR advertising production. From physical products to interactive digital assets in days, not weeks.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-16">
                <Button
                  onClick={() => handleNav("/studio-custom")}
                  size="lg"
                  className="text-white font-semibold px-7 text-sm hover:opacity-90 transition-opacity"
                  style={{
                    background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)",
                    boxShadow: "0 0 28px rgba(109,40,217,0.45)",
                  }}
                >
                  Start Custom Project
                </Button>
                <Link href="/marketplace">
                  <Button
                    size="lg"
                    variant="outline"
                    className="font-semibold px-7 text-sm hover:bg-white/5"
                    style={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "white",
                      background: "transparent",
                    }}
                  >
                    Browse Marketplace
                  </Button>
                </Link> 
              </div>

              {/* Stats */}
              <div className="flex gap-10 sm:gap-16 flex-wrap">
                {stats.map((s, i) => (
                  <div key={i}>
                    <div className="text-3xl font-bold text-white">{s.value}</div>
                    <div className="text-xs mt-1" style={{ color: "#64748b" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right – Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="relative flex items-center justify-center"
            >
              <div
                className="relative w-full rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid rgba(139,92,246,0.25)",
                }}
              >
                <img
                  src="a940202526210112ed774ee070cb6e1f584158f8.png"
                  alt="3D AR Product Showcase"
                  className="w-full h-auto block"
                />
                {/* AR Ready badge */}
                <div
                  className="absolute bottom-5 left-5 flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: "rgba(55,48,163,0.88)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(139,92,246,0.4)",
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span className="text-xs font-semibold text-white">AR Ready</span>
                  <span className="text-xs" style={{ color: "#c4b5fd" }}>Instant Preview</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Our Services ── */}
      <section
        className="py-24 h-[750px]"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className={W}>
          <div className=" flex flex-col items-center justify-center gap-3">
            <h2 className="text-4xl font-bold text-white">
              Our Services
            </h2>

            <p className="text-base max-w-2xl text-center text-slate-500">
              Complete 3D/AR production pipeline from concept to delivery
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 px-24 py-16">
            {services.map((svc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl p-10 flex flex-col gap-6 min-h-[320px]"
                style={{
                  background: "rgba(20, 25, 55, 0.85)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                }}
              >
                {/* ICON */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)",
                  }}
                >
                  {svc.icon}
                </div>

                {/* TEXT CONTENT */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-semibold text-white">
                    {svc.title}
                  </h3>

                  <p className="text-base leading-relaxed text-slate-400 px-4">
                    {svc.description}
                  </p>
                </div>

                {/* CTA */}
                <Link
                  href={svc.link}
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition"
                >
                  {svc.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Production Pipeline ── */}
      <section
        className="py-24 "
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className={W}>
          <div className="flex flex-col items-center justify-center gap-3">
            <h2 className="text-4xl font-bold text-white mb-5">Production Pipeline</h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: "#64748b" }}>
              From brief to delivery in 7 streamlined steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 h-[160px]">
            {pipelineSteps.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl p-7"
                style={{
                  background: "rgba(20, 25, 55, 0.85)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="text-6xl font-bold mb-6"
                  style={{
                    background: "linear-gradient(90deg, #a78bfa, #818cf8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="py-40 justify-end"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="w-full max-w-6xl px-4 py-4 flex justify-end">
          <div
            className="text-center rounded-2xl px-6 md:px-12 lg:px-16 h-[450px] w-[750px] flex flex-col items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #3a1fa0 0%, #3730a3 100%)",
              border: "1px solid rgba(139,92,246,0.35)",
            }}
          >
            <h2 className="text-4xl font-bold text-white mb-6 px-30">
              Ready to Transform Your Advertising?
            </h2>

            <p className="text-lg mb-12 max-w-2xl mx-auto text-white/70">
              Join leading brands using 3D/AR to create unforgettable customer experiences
            </p>

            <Button
              onClick={() => handleNav("/studio-custom")}
              size="lg"
              className="font-semibold px-10 py-6 text-base hover:opacity-90 transition"
              style={{
                background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
                color: "white",
                boxShadow: "0 0 40px rgba(109,40,217,0.45)",
              }}
            >
              Begin Your 3D/AR Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}