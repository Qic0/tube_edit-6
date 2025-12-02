import * as React from "react";
import { cn } from "@/lib/utils";

export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="relative mb-5">
        <input
          id={id}
          className={cn(
            "peer w-full rounded-xl border border-border bg-muted/50 px-3 py-4 text-[15px] text-foreground transition-all duration-200 placeholder:text-transparent focus:border-foreground focus:bg-background focus:shadow-[0_0_0_3px_hsl(var(--foreground)/0.05)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          placeholder=" "
          ref={ref}
          {...props}
        />
        <label
          htmlFor={id}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-background px-1 text-[15px] text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:-top-2 peer-focus:text-xs peer-focus:text-foreground peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-foreground"
        >
          {label}
        </label>
      </div>
    );
  }
);
FloatingInput.displayName = "FloatingInput";

export { FloatingInput };
