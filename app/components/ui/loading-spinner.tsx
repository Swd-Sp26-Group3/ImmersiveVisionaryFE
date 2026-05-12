import { Loader2 } from "lucide-react";
import { cn } from "./utils";

type Size = "xs" | "sm" | "md" | "lg";
type Color = "cyan" | "purple" | "blue" | "white" | "slate";

const SIZE_MAP: Record<Size, string> = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

const COLOR_MAP: Record<Color, string> = {
  cyan:   "text-cyan-400",
  purple: "text-purple-400",
  blue:   "text-blue-400",
  white:  "text-white",
  slate:  "text-slate-400",
};

interface LoadingSpinnerProps {
  size?: Size;
  color?: Color;
  className?: string;
  /** If true, renders centered in a full-height container */
  fullPage?: boolean;
  label?: string;
}

export function LoadingSpinner({
  size = "md",
  color = "cyan",
  className,
  fullPage = false,
  label,
}: LoadingSpinnerProps) {
  const icon = (
    <Loader2
      className={cn("animate-spin", SIZE_MAP[size], COLOR_MAP[color], className)}
    />
  );

  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        {icon}
        {label && <p className="text-slate-400 text-sm">{label}</p>}
      </div>
    );
  }

  return icon;
}
