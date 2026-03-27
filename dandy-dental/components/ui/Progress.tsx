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
    <div className={clsx("h-2 w-full rounded-full bg-secondary overflow-hidden", className)}>
      <div
        className={clsx("h-full rounded-full transition-all duration-300", {
          "bg-primary": color === "primary",
          "bg-success": color === "success",
          "bg-warning": color === "warning",
          "bg-destructive": color === "destructive",
        })}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
