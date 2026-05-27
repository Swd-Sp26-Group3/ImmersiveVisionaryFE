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