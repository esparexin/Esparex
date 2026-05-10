"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "./utils";

import { useFieldContext } from "./field";

function Checkbox({
  className,
  id: customId,
  "aria-describedby": customDescribedBy,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  const reactId = React.useId().replace(/:/g, "");
  const fieldContext = useFieldContext();

  // ID Resolution Order:
  // 1. Context ID (if present inside a <Field> container)
  // 2. Explicit custom ID passed directly to Checkbox
  // 3. Fallback auto-generated ID
  const resolvedId = fieldContext?.id ?? customId ?? `checkbox-${reactId}`;

  // ARIA DescribedBy: merge existing custom descriptions with context error identifier
  const errorId = fieldContext?.hasError ? fieldContext.errorId : undefined;
  const resolvedDescribedBy = [customDescribedBy, errorId].filter(Boolean).join(" ") || undefined;

  // ARIA Invalid: dynamically set to "true" if an error is present, unless explicitly overridden
  const isInvalid = props["aria-invalid"] ?? (fieldContext?.hasError ? "true" : undefined);

  return (
    <CheckboxPrimitive.Root
      id={resolvedId}
      aria-describedby={resolvedDescribedBy}
      aria-invalid={isInvalid}
      data-slot="checkbox"
      className={cn(
        "peer border bg-input-background dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 relative before:absolute before:top-1/2 before:left-1/2 before:h-11 before:w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] before:pointer-events-auto",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
