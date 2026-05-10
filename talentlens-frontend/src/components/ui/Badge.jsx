import { cn } from "../../lib/utils.jsx";

const tones = {
  cyan: "bg-primary/15 text-primary border-primary/25",
  purple: "bg-accent/15 text-accent border-accent/25",
  green: "bg-success/15 text-emerald-300 border-success/30",
  orange: "bg-warning/15 text-amber-300 border-warning/30",
  red: "bg-danger/15 text-red-300 border-danger/30",
  slate: "bg-white/8 text-text border-white/10",
};

export function Badge({ children, tone = "slate", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
