"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Introduction", path: "/" },
    { name: "Marketplace", path: "/marketplace" },
    { name: "Order", path: "/order" },
    { name: "AI Generator", path: "/ai-custom" },
  ];

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-purple-500/10 bg-[#0f1729]/90 backdrop-blur-lg"
      style={{
        background: "rgba(8,11,20,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-8xl w-full px-8 md:px-12 lg:px-16 flex h-25 items-center justify-between">
        {/* Logo */}
        <div className="flex-1">
          <Link href="/" className="ml-40 flex items-center gap-2.5 w-fit">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
            >
              ✦
            </div>
            <span className="text-white font-semibold text-base tracking-tight w-8">
              Immersive Visionary
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              className="text-sm transition-colors"
              style={{ color: pathname === link.path ? "#ffffff" : "#94a3b8" }}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex gap-3 flex-1 justify-end">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm font-medium"
              style={{ color: "#94a3b8" }}
            >
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              size="sm"
              className="text-white font-semibold text-sm px-5"
              style={{
                background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
                boxShadow: "0 0 16px rgba(109,40,217,0.35)",
              }}
            >
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div
          className="md:hidden"
          style={{
            background: "rgba(8,11,20,0.97)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <nav className="max-w-[1440px] mx-auto w-full px-8 md:px-12 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className="text-sm py-1"
                style={{ color: "#94a3b8" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div
              className="flex flex-col gap-2 pt-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full" style={{ color: "#94a3b8" }}>
                  Sign In
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  size="sm"
                  className="w-full text-white"
                  style={{ background: "linear-gradient(135deg, #6d28d9, #4f46e5)" }}
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}