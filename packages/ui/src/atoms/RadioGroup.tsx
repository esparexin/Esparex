"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";
import { cn } from "../utils";
import { useFieldContext } from "../patterns/Field";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, id: customId, "aria-describedby": customDescribedBy, ...props }, ref) => {
  const reactId = React.useId().replace(/:/g, "");
  const fieldContext = useFieldContext();
  
  const resolvedId = fieldContext?.id ?? customId ?? `radiogroup-${reactId}`;
  const errorId = fieldContext?.hasError ? fieldContext.errorId : undefined;
  const resolvedDescribedBy = [customDescribedBy, errorId].filter(Boolean).join(" ") || undefined;
  const isInvalid = props["aria-invalid"] ?? (fieldContext?.hasError ? "true" : undefined);

  return (
    <RadioGroupPrimitive.Root
      id={resolvedId}
      aria-describedby={resolvedDescribedBy}
      aria-invalid={isInvalid}
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
