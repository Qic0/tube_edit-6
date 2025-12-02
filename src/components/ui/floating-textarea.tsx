import * as React from "react";
import { cn } from "@/lib/utils";

export interface FloatingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

const FloatingTextarea = React.forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="relative mb-5">
        <textarea
          id={id}
          className={cn(
            "peer w-full min-h-[100px] resize-none rounded-xl border border-border bg-muted/50 px-3 py-4 text-[15px] text-foreground transition-all duration-200 placeholder:text-transparent focus:border-foreground focus:bg-background focus:shadow-[0_0_0_3px_hsl(var(--foreground)/0.05)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          placeholder=" "
          ref={ref}
          {...props}
        />
        <label
          htmlFor={id}
          className="absolute left-3 top-4 bg-background px-1 text-[15px] text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:-top-2 peer-focus:text-xs peer-focus:text-foreground peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-foreground"
        >
          {label}
        </label>
      </div>
    );
  }
);
FloatingTextarea.displayName = "FloatingTextarea";

export { FloatingTextarea };
