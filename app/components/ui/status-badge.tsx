import { cn } from "./utils";

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  borderColor?: string;
  icon?: React.ReactNode;
}

interface StatusBadgeProps {
  status: string;
  config: Record<string, StatusConfig>;
  /** Show as inline pill (default) or as a badge with border */
  variant?: "pill" | "badge";
  className?: string;
}

export function StatusBadge({
  status,
  config,
  variant = "pill",
  className,
}: StatusBadgeProps) {
  const cfg = config[status] ?? { label: status, color: "text-slate-300", bg: "bg-slate-500/15", borderColor: "border-slate-500/30" };

  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-medium",
          cfg.bg,
          cfg.color,
          cfg.borderColor ?? "border-transparent",
          className
        )}
      >
        {cfg.icon}
        {cfg.label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium",
        cfg.bg,
        cfg.color,
        cfg.borderColor ?? "border-transparent",
        className
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
