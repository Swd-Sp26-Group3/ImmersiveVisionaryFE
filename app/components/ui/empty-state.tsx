import { type LucideIcon } from "lucide-react";
import { cn } from "./utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  iconClassName?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconClassName,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {Icon && (
        <Icon
          className={cn("w-12 h-12 text-slate-700 mx-auto mb-3", iconClassName)}
        />
      )}
      <p className="text-slate-400 font-medium mb-1">{title}</p>
      {description && (
        <p className="text-slate-600 text-sm mb-5 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
