import * as React from "react";
import { cn } from "../utils";
import { useFieldContext } from "./Field";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, id, ...props }, ref) => {
    const fieldContext = useFieldContext();
    const resolvedId = id ?? fieldContext?.id;
    const resolvedAriaInvalid = props["aria-invalid"] ?? (fieldContext?.hasError ? true : undefined);
    const resolvedAriaDescribedBy = props["aria-describedby"] ?? (fieldContext?.hasError ? fieldContext.errorId : undefined);

    return (
      <textarea
        id={resolvedId}
        aria-invalid={resolvedAriaInvalid}
        aria-describedby={resolvedAriaDescribedBy}
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-body-lg md:text-body shadow-sm placeholder:text-foreground-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 focus-visible:aria-invalid:ring-destructive focus-visible:aria-invalid:ring-[3px]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
