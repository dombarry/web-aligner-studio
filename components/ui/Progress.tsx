import { clsx } from "clsx";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: "primary" | "success" | "warning" | "destructive";
}

export function Progress({ value, max = 100, className, color = "primary" }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={clsx("h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden", className)}>
      <div
        className={clsx("h-full rounded-full transition-all duration-500 ease-out", {
          "bg-primary shadow-[0_0_8px_rgba(0,112,243,0.4)]": color === "primary",
          "bg-success shadow-[0_0_8px_rgba(0,200,83,0.4)]": color === "success",
          "bg-warning shadow-[0_0_8px_rgba(255,152,0,0.4)]": color === "warning",
          "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]": color === "destructive",
        })}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
