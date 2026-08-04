import * as React from "react";
import { cn } from "../utils";
import { useFieldContext } from "../patterns/Field";

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

    // ARIA Invalid & Required: dynamically set from FieldContext unless explicitly overridden
    const isInvalid = props["aria-invalid"] ?? (fieldContext?.hasError ? "true" : undefined);
    const isRequired = props["aria-required"] ?? (fieldContext?.required ? "true" : undefined);

    return (
      <input
        className={cn(
          "h-9 w-full rounded-xl border border-input bg-background px-3 text-base md:text-sm shadow-sm transition-[border-color,box-shadow,background-color]",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 focus-visible:aria-invalid:ring-[3px]",
          className
        )}
        ref={ref}
        {...props}
        id={resolvedId}
        name={resolvedName}
        aria-describedby={resolvedDescribedBy}
        aria-invalid={isInvalid}
        aria-required={isRequired}
      />
    );
  }
);
Input.displayName = "Input";
