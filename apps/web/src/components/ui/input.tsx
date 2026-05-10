import * as React from "react";
import { cn } from "@/lib/utils";
import { useFieldContext } from "./field";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, id: customId, "aria-describedby": customDescribedBy, ...props }, ref) => {
    const reactId = React.useId().replace(/:/g, "");
    const fieldContext = useFieldContext();

    // ID Resolution Order:
    // 1. Context ID (if present inside a <Field> container)
    // 2. Explicit custom ID passed directly to Input
    // 3. Fallback auto-generated ID
    const resolvedId = fieldContext?.id ?? customId ?? `input-${reactId}`;
    const resolvedName = props.name ?? customId ?? resolvedId;

    // ARIA DescribedBy: merge existing custom descriptions with the context error identifier
    const errorId = fieldContext?.hasError ? fieldContext.errorId : undefined;
    const resolvedDescribedBy = [customDescribedBy, errorId].filter(Boolean).join(" ") || undefined;

    // ARIA Invalid: dynamically set to "true" if an error is present, unless explicitly overridden
    const isInvalid = props["aria-invalid"] ?? (fieldContext?.hasError ? "true" : undefined);

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
        aria-describedby={resolvedDescribedBy}
        aria-invalid={isInvalid}
      />
    );
  }
);
Input.displayName = "Input";
