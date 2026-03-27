import { clsx } from "clsx";
import { forwardRef, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
          {
            "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] shadow-[0_0_20px_rgba(0,112,243,0.15)] hover:shadow-[0_0_30px_rgba(0,112,243,0.25)]":
              variant === "primary",
            "bg-secondary text-foreground hover:bg-white/[0.08] active:scale-[0.98] border border-white/[0.06]":
              variant === "secondary",
            "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]":
              variant === "ghost",
            "bg-destructive text-white hover:brightness-110 active:scale-[0.98] shadow-[0_0_20px_rgba(239,68,68,0.15)]":
              variant === "destructive",
          },
          {
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2.5 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
