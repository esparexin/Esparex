import * as React from "react";
import { FieldPath, FieldValues } from "react-hook-form";
import { Checkbox } from "./Checkbox";
import {
  FieldControl,
  FieldDescription,
  FieldLabel,
  FieldMessage,
  FieldRoot,
  FormItem,
} from "./Form";

export type ControlledCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = React.ComponentPropsWithoutRef<typeof Checkbox> & {
  name: TName;
  label: React.ReactNode;
  description?: React.ReactNode;
};

export function ControlledCheckbox<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, label, description, className, ...props }: ControlledCheckboxProps<TFieldValues, TName>) {
  return (
    <FieldRoot<TFieldValues, TName>
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FieldControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                {...props}
              />
            </FieldControl>
            <div className="space-y-1 leading-none">
              <FieldLabel>{label}</FieldLabel>
              {description && <FieldDescription>{description}</FieldDescription>}
            </div>
          </div>
          <FieldMessage />
        </FormItem>
      )}
    />
  );
}
