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
import { Stack } from "../layout/Stack";

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
          <Stack direction="row" gap="md" align="start" className="rounded-md border p-4">
            <FieldControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                {...props}
              />
            </FieldControl>
            <Stack gap="xs" className="leading-none">
              <FieldLabel>{label}</FieldLabel>
              {description && <FieldDescription>{description}</FieldDescription>}
            </Stack>
          </Stack>
          <FieldMessage />
        </FormItem>
      )}
    />
  );
}
