import * as React from "react";
import { FieldPath, FieldValues } from "react-hook-form";
import { Textarea, TextareaProps } from "./Textarea";
import {
  FieldControl,
  FieldDescription,
  FieldLabel,
  FieldMessage,
  FieldRoot,
  FormItem,
} from "./Form";

export type ControlledTextareaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = Omit<TextareaProps, "name" | "defaultValue"> & {
  name: TName;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
};

export function ControlledTextarea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, label, description, required, className, ...props }: ControlledTextareaProps<TFieldValues, TName>) {
  return (
    <FieldRoot<TFieldValues, TName>
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FieldLabel required={required}>{label}</FieldLabel>}
          <FieldControl>
            <Textarea {...field} {...props} required={required} />
          </FieldControl>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldMessage />
        </FormItem>
      )}
    />
  );
}
