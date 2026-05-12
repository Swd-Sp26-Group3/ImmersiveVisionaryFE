import { cn } from "./utils";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterPillsProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  counts?: Record<string, number>;
  activeClass?: string;
  className?: string;
}

export function FilterPills({
  options,
  value,
  onChange,
  counts,
  activeClass = "bg-purple-600 border-purple-600 text-white",
  className,
}: FilterPillsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "text-xs px-3 py-1 rounded-full border transition-all",
            value === opt.value
              ? activeClass
              : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"
          )}
        >
          {opt.label}
          {counts && opt.value in counts && (
            <span className="ml-1 opacity-50">({counts[opt.value]})</span>
          )}
        </button>
      ))}
    </div>
  );
}
