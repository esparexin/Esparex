import * as React from "react";
import { FieldPath, FieldValues } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Input, InputProps } from "./Input";
import { InputGroup, InputSuffix } from "./InputGroup";
import {
  FieldControl,
  FieldDescription,
  FieldLabel,
  FieldMessage,
  FieldRoot,
  FormItem,
} from "./Form";

export type ControlledPasswordProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = Omit<InputProps, "name" | "defaultValue" | "type"> & {
  name: TName;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
};

export function ControlledPassword<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  description,
  required,
  className,
  ...props
}: ControlledPasswordProps<TFieldValues, TName>) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <FieldRoot<TFieldValues, TName>
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FieldLabel required={required}>{label}</FieldLabel>}
          <FieldControl>
            <InputGroup>
              <Input
                {...field}
                {...props}
                type={showPassword ? "text" : "password"}
                required={required}
              />
              <InputSuffix>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="flex items-center justify-center rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground-subtle hover:text-foreground-secondary transition-colors h-full w-full"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </InputSuffix>
            </InputGroup>
          </FieldControl>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldMessage />
        </FormItem>
      )}
    />
  );
}
