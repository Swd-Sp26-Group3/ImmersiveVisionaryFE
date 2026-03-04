import { Box, Facebook, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-purple-500/10 bg-[#0a0e1a]/50">
      <div className="max-w-8xl mx-auto px-8 md:px-12 lg:px-20 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                <Box className="w-5 h-5 text-white" />
              </div>
              <span className="text-white">Immersive Visionary</span>
            </Link>
            <p className="text-gray-400 text-sm mb-4 max-w-sm">
              Transform your advertising with enterprise-grade 3D modeling and AR production. From concept to immersive reality.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  Marketplace
                </Link>
              </li>
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
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>hello@immersivevisionary.com</li>
              <li>+84 28 7300 1234</li>
              <li>Ho Chi Minh City, Vietnam</li>
            </ul>
          </div>
        </div>

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