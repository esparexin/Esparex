import * as React from "react";
import { FieldPath, FieldValues } from "react-hook-form";
import { OtpInput, OtpInputProps } from "./OtpInput";
import {
  FieldControl,
  FieldDescription,
  FieldLabel,
  FieldMessage,
  FieldRoot,
  FormItem,
} from "./Form";
import { useFormField } from "./Form"; // to get error state

export type ControlledOtpProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = Omit<OtpInputProps, "value" | "onChange"> & {
  name: TName;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  animateOnError?: boolean;
};

// We wrap OtpInput in a component that reads from useFormField
const FieldAwareOtpInput = React.forwardRef<HTMLDivElement, Omit<OtpInputProps, "hasError">>(
  (props, ref) => {
    const { error } = useFormField();
    return <OtpInput ref={ref} hasError={!!error} {...props} />;
  }
);
FieldAwareOtpInput.displayName = "FieldAwareOtpInput";

export function ControlledOtp<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  description,
  required,
  animateOnError,
  className,
  ...props
}: ControlledOtpProps<TFieldValues, TName>) {
  return (
    <FieldRoot<TFieldValues, TName>
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FieldLabel required={required}>{label}</FieldLabel>}
          <FieldControl animateOnError={animateOnError}>
            <FieldAwareOtpInput
              value={field.value}
              onChange={field.onChange}
              {...props}
            />
          </FieldControl>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldMessage />
        </FormItem>
      )}
    />
  );
}
