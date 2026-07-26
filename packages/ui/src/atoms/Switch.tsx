"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "../utils";
import { useFieldContext } from "../patterns/Field";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, id: customId, "aria-describedby": customDescribedBy, ...props }, ref) => {
  const reactId = React.useId().replace(/:/g, "");
  const fieldContext = useFieldContext();
  
  const resolvedId = fieldContext?.id ?? customId ?? `switch-${reactId}`;
  const errorId = fieldContext?.hasError ? fieldContext.errorId : undefined;
  const resolvedDescribedBy = [customDescribedBy, errorId].filter(Boolean).join(" ") || undefined;
  const isInvalid = props["aria-invalid"] ?? (fieldContext?.hasError ? "true" : undefined);

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className
      )}
      {...props}
      id={resolvedId}
      aria-describedby={resolvedDescribedBy}
      aria-invalid={isInvalid}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
