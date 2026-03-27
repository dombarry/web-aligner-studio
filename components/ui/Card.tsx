import { clsx } from "clsx";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
  glass?: boolean;
}

export function Card({ className, padding = true, glass = false, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border transition-colors duration-200",
        glass
          ? "glass"
          : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]",
        padding && "p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={clsx("text-lg font-semibold tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}
