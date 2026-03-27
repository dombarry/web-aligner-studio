import { clsx } from "clsx";
import { forwardRef, SelectHTMLAttributes } from "react";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={clsx(
          "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm text-foreground transition-all duration-200 cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:bg-white/[0.05]",
          "disabled:opacity-40 disabled:pointer-events-none",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";
