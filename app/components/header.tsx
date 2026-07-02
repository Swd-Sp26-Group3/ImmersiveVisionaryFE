"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, User, ChevronRight, Sparkles, ShoppingCart } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { getHomeByRole } from "@/lib/roleRoutes";

const NAV_RESTRICTED_PATHS = ["/marketplace", "/order", "/"];
const RESTRICTED_ROLES = ["MANAGER", "ADMIN"];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalCount, toggleCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [signInHover, setSignInHover] = useState(false);
  const [getStartedHover, setGetStartedHover] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dashboardPath = getHomeByRole(user?.role ?? "CUSTOMER");

  const navLinks = [
    { name: "Giới thiệu",  path: "/",             requiresAuth: false },
    { name: "Marketplace", path: "/marketplace",  requiresAuth: false },
    { name: "My Team Adventure", path: "/my-team-adventure", requiresAuth: false },
    { name: "Đặt hàng",   path: "/order",         requiresAuth: true  },
    { name: "Hỗ trợ",     path: "/support",       requiresAuth: true  },
  ].filter((link) => {
    if (RESTRICTED_ROLES.includes(user?.role ?? "") && NAV_RESTRICTED_PATHS.includes(link.path)) {
      return false;
    }
    if (link.path === "/support" && user?.role && user.role.toUpperCase() !== "CUSTOMER") {
      return false;
    }
    return true;
  });

  const handleNav = (path: string, requiresAuth: boolean) => {
    if (requiresAuth && !isAuthenticated) router.push("/login");
    else router.push(path);
  };

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const shouldBeTransparent = isAuthPage && !scrolled;

  return (
    <header
      className={`sticky top-0 z-[100] w-full border-b transition-all duration-300 ${
        shouldBeTransparent
          ? "bg-transparent border-transparent"
          : "backdrop-blur-[20px] border-white/[0.06]"
      }`}
      style={shouldBeTransparent ? {} : { background: "rgba(8,11,20,0.85)" }}
    >
      <div className="max-w-8xl mx-auto w-full px-4 sm:px-6 md:px-10 lg:px-16 flex h-16 md:h-20 items-center justify-between">

        {/* Logo */}
        <div className="flex-1 min-w-0">
          <Link href="/" className="flex items-center gap-2 w-fit group">
            <div
              className="relative flex-shrink-0 transition-all duration-300 group-hover:scale-110 rounded-xl overflow-hidden border border-white/10 bg-slate-950/40 p-1"
              style={{
                filter: "drop-shadow(0 0 8px rgba(139,92,246,0.4))",
              }}
            >
              <Image
                src="/imvrs-logo.png?v=11"
                alt="IMVRS Logo"
                width={48}
                height={48}
                className="object-contain w-10 h-10 md:w-12 md:h-12"
                priority
              />
            </div>
            <span className="text-white font-semibold text-sm md:text-base tracking-tight transition-opacity duration-200 group-hover:opacity-80">
              Immersive Visionary
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <button
                key={link.name}
                onClick={() => handleNav(link.path, link.requiresAuth)}
                className="relative text-sm transition-colors duration-200 group"
                style={{ color: isActive ? "#ffffff" : "var(--text-secondary)" }}
              >
                {link.name}
                {/* Active underline */}
                <span
                  className={`absolute -bottom-1 left-0 h-px transition-all duration-300 ${
                    isActive ? "w-full bg-white" : "w-0 bg-purple-400 group-hover:w-full"
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex gap-3 flex-1 justify-end items-center">
          {/* Cart Icon — only for authenticated non-restricted users */}
          {isAuthenticated && !RESTRICTED_ROLES.includes(user?.role ?? "") && (
            <button
              onClick={toggleCart}
              aria-label="Giỏ hàng"
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: "rgba(109,40,217,0.12)",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
            >
              <ShoppingCart className="w-4 h-4 text-indigo-300" />
              {totalCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  {totalCount > 99 ? "99+" : totalCount}
                </span>
              )}
            </button>
          )}
          {isAuthenticated ? (
            /* ── Authenticated: Avatar dropdown ── */
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: userMenuOpen
                    ? "rgba(109,40,217,0.25)"
                    : "rgba(109,40,217,0.12)",
                  borderColor: userMenuOpen
                    ? "rgba(139,92,246,0.5)"
                    : "rgba(139,92,246,0.2)",
                  boxShadow: userMenuOpen
                    ? "0 0 16px rgba(109,40,217,0.2)"
                    : "none",
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  {(user?.name ?? user?.email ?? "U")[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-indigo-300 max-w-[120px] truncate">
                  {user?.name ?? user?.email}
                </span>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-indigo-400 transition-transform duration-200 ${
                    userMenuOpen ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl border overflow-hidden shadow-2xl"
                  style={{
                    background: "rgba(13,21,38,0.98)",
                    borderColor: "rgba(139,92,246,0.2)",
                    backdropFilter: "blur(16px)",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(109,40,217,0.1)",
                  }}
                >
                  <Link
                    href={dashboardPath}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <User className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    Bảng điều khiển
                  </Link>
                  <div className="h-px mx-4" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Guest: Sign In + Get Started ── */
            <div className="flex items-center gap-2">

              {/* Sign In — ghost with animated underline */}
              <Link href="/login">
                <button
                  onMouseEnter={() => setSignInHover(true)}
                  onMouseLeave={() => setSignInHover(false)}
                  className="relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 active:scale-95 overflow-hidden"
                  style={{ color: signInHover ? "#ffffff" : "var(--text-secondary)" }}
                >
                  {/* Hover glow background */}
                  <span
                    className="absolute inset-0 rounded-lg transition-opacity duration-200"
                    style={{
                      background: "radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 70%)",
                      opacity: signInHover ? 1 : 0,
                    }}
                  />
                  <span className="relative">Đăng nhập</span>
                  {/* Bottom border slide */}
                  <span
                    className="absolute bottom-0.5 left-1/2 h-px bg-purple-400 transition-all duration-300"
                    style={{
                      width: signInHover ? "calc(100% - 16px)" : "0%",
                      transform: "translateX(-50%)",
                    }}
                  />
                </button>
              </Link>

              {/* Get Started — gradient with shimmer on hover */}
              <Link href="/signup">
                <button
                  onMouseEnter={() => setGetStartedHover(true)}
                  onMouseLeave={() => setGetStartedHover(false)}
                  className="relative overflow-hidden flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all duration-200 active:scale-95"
                  style={{
                    background: "var(--gradient-brand)",
                    boxShadow: getStartedHover
                      ? "0 0 28px rgba(109,40,217,0.55), 0 4px 16px rgba(109,40,217,0.3)"
                      : "0 0 16px rgba(109,40,217,0.3)",
                    transform: getStartedHover ? "translateY(-1px)" : "translateY(0)",
                  }}
                >
                  {/* Shimmer sweep */}
                  <span
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                      background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)",
                      opacity: getStartedHover ? 1 : 0,
                      animation: getStartedHover ? "shimmer 0.6s ease forwards" : "none",
                    }}
                  />
                  <Sparkles
                    className="w-3.5 h-3.5 relative transition-transform duration-300"
                    style={{ transform: getStartedHover ? "rotate(12deg) scale(1.1)" : "none" }}
                  />
                  <span className="relative">Bắt đầu ngay</span>
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="relative block w-5 h-5">
            <X
              className={`absolute inset-0 w-5 h-5 transition-all duration-200 ${
                mobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
              }`}
            />
            <Menu
              className={`absolute inset-0 w-5 h-5 transition-all duration-200 ${
                mobileMenuOpen ? "opacity-0 rotate-90" : "opacity-100 rotate-0"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden border-t overflow-hidden transition-all duration-300 ${
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ background: "rgba(8,11,20,0.97)", borderColor: "var(--border-subtle)" }}
      >
        <nav className="max-w-[1440px] mx-auto w-full px-8 py-4 flex flex-col gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <button
                key={link.name}
                className={`text-sm py-2.5 px-3 text-left rounded-lg transition-all duration-150 ${
                  isActive
                    ? "text-white bg-white/5"
                    : "hover:bg-white/5 hover:text-white"
                }`}
                style={{ color: isActive ? "#ffffff" : "var(--text-secondary)" }}
                onClick={() => { handleNav(link.path, link.requiresAuth); setMobileMenuOpen(false); }}
              >
                {link.name}
              </button>
            );
          })}

          <div className="pt-3 mt-1 border-t flex flex-col gap-2" style={{ borderColor: "var(--border-subtle)" }}>
            {isAuthenticated ? (
              <>
                <Link
                  href={dashboardPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                >
                  <User className="w-4 h-4" />
                  {user?.name ?? user?.email}
                </Link>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <div className="px-3 py-2.5 rounded-lg text-sm text-center border border-white/10 hover:border-purple-500/40 hover:bg-white/5 transition-all duration-200"
                    style={{ color: "var(--text-secondary)" }}>
                    Đăng nhập
                  </div>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <div
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-white font-semibold transition-all duration-200 hover:opacity-90"
                    style={{
                      background: "var(--gradient-brand)",
                      boxShadow: "0 4px 16px rgba(109,40,217,0.3)",
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Bắt đầu ngay
                  </div>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Shimmer keyframe */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </header>
  );
}
