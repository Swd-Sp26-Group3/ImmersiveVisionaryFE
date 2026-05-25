"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "./utils";

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

const MAX_WIDTH_MAP: Record<MaxWidth, string> = {
  sm:  "max-w-sm",
  md:  "max-w-md",
  lg:  "max-w-lg",
  xl:  "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: MaxWidth;
  className?: string;
  /** Extra content in the header (e.g. status badge) */
  headerExtra?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "2xl",
  className,
  headerExtra,
  footer,
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={cn(
          "w-full rounded-2xl border border-white/10 bg-[var(--surface-2)] shadow-2xl flex flex-col max-h-[90vh]",
          MAX_WIDTH_MAP[maxWidth],
          className
        )}
      >
        {/* Header */}
        {(title || headerExtra) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {title && (
                <h2 className="text-white font-semibold text-base truncate">{title}</h2>
              )}
              {headerExtra}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-white/[0.06] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
