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
          "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base shadow-sm transition-colors",
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
