import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const reactId = React.useId().replace(/:/g, "");
    const resolvedId = props.id ?? props.name ?? `input-${reactId}`;
    const resolvedName = props.name ?? props.id ?? resolvedId;

    return (
      <input
        className={cn(
          "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm transition-[border-color,box-shadow,background-color]",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
        id={resolvedId}
        name={resolvedName}
      />
    );
  }
);
Input.displayName = "Input";
