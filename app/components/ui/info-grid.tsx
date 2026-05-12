import { cn } from "./utils";

interface InfoItem {
  label: string;
  value: React.ReactNode;
}

interface InfoGridProps {
  items: InfoItem[];
  cols?: 2 | 3 | 4;
  className?: string;
  cellClassName?: string;
}

const COLS_MAP: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
};

export function InfoGrid({ items, cols = 3, className, cellClassName }: InfoGridProps) {
  return (
    <div className={cn("grid gap-3", COLS_MAP[cols], className)}>
      {items.map(({ label, value }) => (
        <div
          key={label}
          className={cn(
            "bg-slate-900/50 border border-white/[0.06] rounded-xl p-3",
            cellClassName
          )}
        >
          <p className="text-slate-500 text-xs mb-1">{label}</p>
          <p className="text-white text-sm font-medium">{value}</p>
        </div>
      ))}
    </div>
  );
}
