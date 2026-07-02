"use client";
import { useAuth } from "@/context/AuthContext";
import { Facebook, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const { user, isAuthenticated } = useAuth();
  const isRestricted = isAuthenticated && (user?.role === "MANAGER" || user?.role === "ADMIN");

  return (
    <footer className="border-t border-purple-500/10 bg-[#0a0e1a]/50">
      <div className="max-w-8xl mx-auto px-8 md:px-12 lg:px-20 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Thương hiệu */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4 w-fit group">
              <div
                className="relative flex-shrink-0 transition-all duration-300 group-hover:scale-110 rounded-xl overflow-hidden border border-white/10 bg-slate-950/40 p-1"
                style={{
                  filter: "drop-shadow(0 0 8px rgba(139,92,246,0.4))",
                }}
              >
                <Image
                  src="/imvrs-logo.png?v=11"
                  alt="IMVRS Logo"
                  width={44}
                  height={44}
                  className="object-contain w-9 h-9 md:w-11 md:h-11"
                  priority
                />
              </div>
              <span className="text-white transition-opacity duration-200 group-hover:opacity-80">Immersive Visionary</span>
            </Link>
            <p className="text-gray-400 text-sm mb-6 max-w-sm leading-relaxed">
              Nâng tầm quảng cáo của bạn với dịch vụ mô hình 3D và sản xuất AR cấp doanh nghiệp. Từ ý tưởng đến thực tế sống động.
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
              <a
                href="https://www.tiktok.com/@immersivevisionary"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.95.89 2.22 1.45 3.52 1.62V9.7c-1.78-.17-3.4-.95-4.58-2.27V15c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c.35 0 .69.02 1.03.07V9.7c-1-.28-2.07-.15-2.99.39-.92.54-1.57 1.45-1.8 2.5-.23 1.05-.03 2.16.56 3.07.59.91 1.55 1.51 2.63 1.67.14.02.29.03.44.03 2.45 0 4.45-2 4.45-4.45V0h.24z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Liên kết nhanh */}
          <div>
            <h3 className="font-semibold text-white mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm">
              {!isRestricted && (
                <li>
                  <Link href="/" className="text-gray-400 hover:text-indigo-400 transition-colors">
                    Trang chủ
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
              {!isRestricted && (
                <li>
                  <Link href="/my-team-adventure" className="text-gray-400 hover:text-indigo-400 transition-colors">
                    My Team Adventure
                  </Link>
                </li>
              )}
              {isAuthenticated && !isRestricted && (
                <li>
                  <Link href="/order" className="text-gray-400 hover:text-indigo-400 transition-colors">
                    Đặt hàng
                  </Link>
                </li>
              )}
              {isAuthenticated && user?.role?.toUpperCase() === "CUSTOMER" && (
                <li>
                  <Link href="/support" className="text-gray-400 hover:text-indigo-400 transition-colors">
                    Hỗ trợ
                  </Link>
                </li>
              )}
              {!isAuthenticated && (
                <>
                  <li>
                    <Link href="/login" className="text-gray-400 hover:text-indigo-400 transition-colors">
                      Đăng nhập
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup" className="text-gray-400 hover:text-indigo-400 transition-colors">
                      Đăng ký
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Liên hệ */}
          <div>
            <h3 className="font-semibold text-white mb-4">Liên hệ</h3>
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
            © 2026 Immersive Visionary. Tất cả quyền được bảo lưu.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
              Chính sách bảo mật
            </a>
            <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
              Điều khoản dịch vụ
            </a>
            <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
              Chính sách Cookie
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}