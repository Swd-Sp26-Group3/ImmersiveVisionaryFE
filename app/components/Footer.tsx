"use client";
import { useAuth } from "@/context/AuthContext";
import { Box, Facebook, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const { user, isAuthenticated } = useAuth();
  const isRestricted = isAuthenticated && (user?.role === "MANAGER" || user?.role === "ADMIN");

  return (
    <footer className="border-t border-purple-500/10 bg-[#0a0e1a]/50">
      <div className="max-w-8xl mx-auto px-8 md:px-12 lg:px-20 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4 w-fit group">
              <div
                className="relative flex-shrink-0 transition-all duration-300 group-hover:scale-110 rounded-xl overflow-hidden border border-white/10 bg-slate-950/40 p-0.5"
                style={{
                  filter: "drop-shadow(0 0 8px rgba(139,92,246,0.4))",
                }}
              >
                <Image
                  src="/imvrs-logo.png"
                  alt="IMVRS Logo"
                  width={36}
                  height={36}
                  className="object-cover w-7 h-7 md:w-9 md:h-9 rounded-[10px]"
                  priority
                />
              </div>
              <span className="text-white transition-opacity duration-200 group-hover:opacity-80">Immersive Visionary</span>
            </Link>
            <p className="text-gray-400 text-sm mb-6 max-w-sm leading-relaxed">
              Transform your advertising with enterprise-grade 3D modeling and AR production. From concept to immersive reality.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/Immersivis"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {!isRestricted && (
                <li>
                  <Link href="/" className="text-gray-400 hover:text-indigo-400 transition-colors">
                    Home
                  </Link>
                </li>
              )}
              {!isRestricted && (
                <li>
                  <Link href="/marketplace" className="text-gray-400 hover:text-indigo-400 transition-colors">
                    Marketplace
                  </Link>
                </li>
              )}
              {isAuthenticated && !isRestricted && (
                <li>
                  <Link href="/order" className="text-gray-400 hover:text-indigo-400 transition-colors">
                    Order
                  </Link>
                </li>
              )}
              {isAuthenticated && user?.role?.toUpperCase() === "CUSTOMER" && (
                <li>
                  <Link href="/support" className="text-gray-400 hover:text-indigo-400 transition-colors">
                    Support
                  </Link>
                </li>
              )}
              {!isAuthenticated && (
                <>
                  <li>
                    <Link href="/login" className="text-gray-400 hover:text-indigo-400 transition-colors">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup" className="text-gray-400 hover:text-indigo-400 transition-colors">
                      Sign Up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a
                  href="mailto:khoalen205@gmail.com"
                  className="flex items-center gap-2 hover:text-indigo-400 transition-colors group"
                >
                  <Mail className="w-4 h-4 text-purple-500 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                  khoalen205@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-gray-500">
                <span className="mt-0.5">📍</span>
                <span>Lô E2a-7, Đường D1, Khu Công nghệ cao, Phường Tăng Nhơn Phú, TP. Hồ Chí Minh</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-purple-500/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © 2026 Immersive Visionary. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}