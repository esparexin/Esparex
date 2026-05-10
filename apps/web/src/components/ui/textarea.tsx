import * as React from "react";
import { cn } from "@/lib/utils";
import { useFieldContext } from "./field";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", id: customId, "aria-describedby": customDescribedBy, ...props }, ref) => {
    const reactId = React.useId().replace(/:/g, "");
    const fieldContext = useFieldContext();

    // ID Resolution Order:
    // 1. Context ID (if present inside a <Field> container)
    // 2. Explicit custom ID passed directly to Textarea
    // 3. Fallback auto-generated ID
    const resolvedId = fieldContext?.id ?? customId ?? `textarea-${reactId}`;
    const resolvedName = props.name ?? customId ?? resolvedId;

    // ARIA DescribedBy: merge existing custom descriptions with context error identifier
    const errorId = fieldContext?.hasError ? fieldContext.errorId : undefined;
    const resolvedDescribedBy = [customDescribedBy, errorId].filter(Boolean).join(" ") || undefined;

    // ARIA Invalid: dynamically set to "true" if an error is present, unless explicitly overridden
    const isInvalid = props["aria-invalid"] ?? (fieldContext?.hasError ? "true" : undefined);

    return (
      <textarea
        className={cn(
          "flex min-h-[112px] w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm transition-[border-color,box-shadow,background-color]",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
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

Textarea.displayName = "Textarea";

export { Textarea };
