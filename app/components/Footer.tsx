"use client";
import { useAuth } from "@/context/AuthContext";
import { Box, Facebook, Linkedin, Twitter, Phone, Mail } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const { user, isAuthenticated } = useAuth();
  const isRestricted = isAuthenticated && (user?.role === "MANAGER" || user?.role === "ADMIN");

  return (
    <footer className="border-t border-purple-500/10 bg-[#0a0e1a]/50">
      <div className="max-w-8xl mx-auto px-8 md:px-12 lg:px-20 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4 w-fit">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                <Box className="w-5 h-5 text-white" />
              </div>
              <span className="text-white">Immersive Visionary</span>
            </Link>
            <p className="text-gray-400 text-sm mb-6 max-w-sm leading-relaxed">
              Transform your advertising with enterprise-grade 3D modeling and AR production. From concept to immersive reality.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                aria-label="Twitter"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#"
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
                  href="mailto:support@immersivevisionary.com"
                  className="flex items-center gap-2 hover:text-indigo-400 transition-colors group"
                >
                  <Mail className="w-4 h-4 text-purple-500 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                  support@immersivevisionary.com
                </a>
              </li>
              <li>
                <a
                  href="https://zalo.me/0900000000"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-indigo-400 transition-colors group"
                >
                  <span className="w-4 h-4 text-xs font-bold text-blue-400 group-hover:text-indigo-400 flex-shrink-0 leading-none">Z</span>
                  Zalo: +84 9xx xxx xxx
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/84900000000"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-indigo-400 transition-colors group"
                >
                  <Phone className="w-4 h-4 text-green-500 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                  WhatsApp: +84 9xx xxx xxx
                </a>
              </li>
              <li className="text-gray-500">Ho Chi Minh City, Vietnam</li>
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