import * as React from "react";
import { FieldPath, FieldValues } from "react-hook-form";
import { RadioGroup } from "./RadioGroup";
import {
  FieldControl,
  FieldDescription,
  FieldLabel,
  FieldMessage,
  FieldRoot,
  FormItem,
} from "./Form";

export type ControlledRadioGroupProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = Omit<React.ComponentPropsWithoutRef<typeof RadioGroup>, "name" | "defaultValue" | "value" | "onValueChange"> & {
  name: TName;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
};

export function ControlledRadioGroup<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, label, description, required, className, children, ...props }: ControlledRadioGroupProps<TFieldValues, TName>) {
  return (
    <FieldRoot<TFieldValues, TName>
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FieldLabel required={required}>{label}</FieldLabel>}
          <FieldControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value as string}
              {...props}
            >
              {children}
            </RadioGroup>
          </FieldControl>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldMessage />
        </FormItem>
      )}
    />
  );
}
