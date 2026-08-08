import * as React from "react";
import { cn } from "../utils";
import { useFieldContext } from "./Field";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, id, ...props }, ref) => {
    const fieldContext = useFieldContext();
    const resolvedId = id ?? fieldContext?.id;
    const resolvedAriaInvalid = props["aria-invalid"] ?? (fieldContext?.hasError ? true : undefined);
    const resolvedAriaDescribedBy = props["aria-describedby"] ?? (fieldContext?.hasError ? fieldContext.errorId : undefined);

    return (
      <input
        type={type}
        id={resolvedId}
        aria-invalid={resolvedAriaInvalid}
        aria-describedby={resolvedAriaDescribedBy}
        className={cn(
          "flex h-11 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 focus-visible:aria-invalid:ring-destructive focus-visible:aria-invalid:ring-[3px]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
