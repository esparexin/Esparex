import * as React from "react";
import { FieldPath, FieldValues } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import {
  FieldControl,
  FieldDescription,
  FieldLabel,
  FieldMessage,
  FieldRoot,
  FormItem,
} from "./Form";

export type ControlledSelectOption = {
  label: string;
  value: string;
};

export type ControlledSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = Omit<React.ComponentPropsWithoutRef<typeof Select>, "name" | "defaultValue"> & {
  name: TName;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  options: ControlledSelectOption[];
  placeholder?: string;
  className?: string;
};

export function ControlledSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, label, description, required, options, placeholder, className, ...props }: ControlledSelectProps<TFieldValues, TName>) {
  return (
    <FieldRoot<TFieldValues, TName>
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FieldLabel required={required}>{label}</FieldLabel>}
          <FieldControl>
            <Select onValueChange={field.onChange} defaultValue={field.value} {...props}>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldControl>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldMessage />
        </FormItem>
      )}
    />
  );
}
