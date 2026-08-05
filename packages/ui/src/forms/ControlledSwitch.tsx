import * as React from "react";
import { FieldPath, FieldValues } from "react-hook-form";
import { Switch } from "./Switch";
import {
  FieldControl,
  FieldDescription,
  FieldLabel,
  FieldMessage,
  FieldRoot,
  FormItem,
} from "./Form";

export type ControlledSwitchProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = React.ComponentPropsWithoutRef<typeof Switch> & {
  name: TName;
  label: React.ReactNode;
  description?: React.ReactNode;
};

export function ControlledSwitch<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, label, description, className, ...props }: ControlledSwitchProps<TFieldValues, TName>) {
  return (
    <FieldRoot<TFieldValues, TName>
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FieldLabel className="text-base">{label}</FieldLabel>
              {description && <FieldDescription>{description}</FieldDescription>}
            </div>
            <FieldControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                {...props}
              />
            </FieldControl>
          </div>
          <FieldMessage />
        </FormItem>
      )}
    />
  );
}
