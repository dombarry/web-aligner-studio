import { clsx } from "clsx";
import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors",
        {
          "bg-primary/10 text-primary border border-primary/20": variant === "default",
          "bg-success/10 text-success border border-success/20": variant === "success",
          "bg-warning/10 text-warning border border-warning/20": variant === "warning",
          "bg-destructive/10 text-destructive border border-destructive/20": variant === "destructive",
          "border border-white/[0.08] text-muted-foreground": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
