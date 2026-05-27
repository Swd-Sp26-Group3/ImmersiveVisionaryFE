"use client";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import {
  X,
  ShoppingCart,
  Package,
  Clock,
  Trash2,
  ArrowRight,
  Inbox,
} from "lucide-react";
import { useEffect, useRef } from "react";

const SPEED_LABEL: Record<string, string> = {
  standard: "Standard (7–10 days)",
  express: "Express (3–5 days)",
  rush: "Rush (1–2 days)",
};

const BUDGET_LABEL: Record<string, string> = {
  "100k-250k": "100k – 250k ₫",
  "250k-750k": "250k – 750k ₫",
  "750k-1250k": "750k – 1.25M ₫",
  "1250k+": "Over 1.25M ₫",
};

export function CartDrawer() {
  const { items, totalCount, removeItem, closeCart, isOpen } = useCart();
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeCart]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={closeCart}
        className="fixed inset-0 z-[200] transition-all duration-300"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Drawer Panel */}
      <div
        className="fixed top-0 right-0 h-full z-[201] flex flex-col"
        style={{
          width: "min(420px, 95vw)",
          background: "rgba(9,12,22,0.98)",
          borderLeft: "1px solid rgba(139,92,246,0.15)",
          boxShadow: "-24px 0 80px rgba(0,0,0,0.6)",
          backdropFilter: "blur(24px)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(109,40,217,0.25)" }}
            >
              <ShoppingCart className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">
                Giỏ hàng
              </h2>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {totalCount} đơn hàng đang chờ
              </p>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-150 active:scale-95"
            aria-label="Đóng giỏ hàng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(109,40,217,0.12)" }}
              >
                <Inbox className="w-8 h-8 text-purple-400/60" />
              </div>
              <div className="text-center">
                <p className="text-slate-300 font-medium mb-1">
                  Giỏ hàng trống
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Đặt order custom để thêm vào đây
                </p>
              </div>
              <button
                onClick={() => { closeCart(); router.push("/order"); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ background: "var(--gradient-brand)" }}
              >
                <ShoppingCart className="w-4 h-4" />
                Đặt ngay
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.orderId}
                className="rounded-xl p-4 relative group"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(139,92,246,0.12)",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(139,92,246,0.12)")
                }
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(99,102,241,0.2)" }}
                    >
                      <Package className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {item.projectName}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {item.productType ?? "Custom Order"}
                      </p>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeItem(item.orderId)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0 transition-all duration-150"
                    aria-label="Xóa khỏi giỏ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Meta pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {item.deliverySpeed && (
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                      style={{
                        background: "rgba(99,102,241,0.12)",
                        color: "#a5b4fc",
                      }}
                    >
                      <Clock className="w-3 h-3" />
                      {SPEED_LABEL[item.deliverySpeed] ?? item.deliverySpeed}
                    </span>
                  )}
                  {item.budget && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        background: "rgba(139,92,246,0.12)",
                        color: "#c4b5fd",
                      }}
                    >
                      {BUDGET_LABEL[item.budget] ?? item.budget}
                    </span>
                  )}
                  <span
                    className="px-2 py-0.5 rounded-full text-xs ml-auto"
                    style={{
                      background:
                        item.status === "submitted"
                          ? "rgba(34,197,94,0.12)"
                          : "rgba(234,179,8,0.12)",
                      color:
                        item.status === "submitted" ? "#86efac" : "#fde047",
                    }}
                  >
                    {item.status === "submitted" ? "Đã gửi" : "Đang chờ"}
                  </span>
                </div>

                {/* Date + view */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Đặt ngày {formatDate(item.addedAt)}
                  </span>
                  <button
                    onClick={() => {
                      closeCart();
                      router.push("/customer-dashboard?tab=orders");
                    }}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Xem chi tiết
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            className="px-4 py-4 flex-shrink-0 space-y-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={() => { closeCart(); router.push("/customer-dashboard?tab=orders"); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ background: "var(--gradient-brand)" }}
            >
              Xem tất cả đơn hàng
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { closeCart(); router.push("/order"); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/5 active:scale-[0.98]"
              style={{
                border: "1px solid rgba(139,92,246,0.3)",
                color: "var(--text-secondary)",
              }}
            >
              <ShoppingCart className="w-4 h-4" />
              Thêm đơn mới
            </button>
          </div>
        )}
      </div>
    </>
  );
}
