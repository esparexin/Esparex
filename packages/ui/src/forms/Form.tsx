"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import { cn } from "../utils";
import { Stack } from "../layout/Stack";
const Form = FormProvider;

type FieldContextValue = {
  id: string;
  name: string;
};

const FieldContext = React.createContext<FieldContextValue>({} as FieldContextValue);

const FieldRoot = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FieldContext.Provider value={{ name: props.name, id: props.name }}>
      <Controller {...props} />
    </FieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FieldContext);
  const itemContext = React.useContext(FormItemContext);
  const formContext = useFormContext();

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FieldRoot>");
  }

  const { id } = itemContext;

  const fieldState = formContext ? formContext.getFieldState(fieldContext.name, formContext.formState) : null;
  const formState = formContext?.formState;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    error: fieldState?.error,
    
    // Extended validation states
    pristine: formState?.isDirty === false,
    dirty: fieldState?.isDirty,
    touched: fieldState?.isTouched,
    valid: fieldState && !fieldState.error,
    invalid: fieldState && !!fieldState.error,
    submitted: formState?.isSubmitted,
    submitSuccessful: formState?.isSubmitSuccessful,
    submitFailed: formState?.submitCount ? formState.submitCount > 0 && !formState.isSubmitSuccessful : false,
    validating: formState?.isValidating,
    pending: formState?.isLoading,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <Stack gap="sm" ref={ref} className={className} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

const FieldLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }
>(({ className, required, children, ...props }, ref) => {
  const { formItemId } = useFormField();

  return (
    <label
      ref={ref}
      htmlFor={formItemId}
      className={cn(
        "text-sm font-semibold leading-none text-foreground-secondary peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
    </label>
  );
});
FieldLabel.displayName = "FieldLabel";

const FieldControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot> & { animateOnError?: boolean }
>(({ animateOnError, className, ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      aria-errormessage={error ? formMessageId : undefined}
      className={cn(className, error && animateOnError && "animate-[shake_0.28s_ease-in-out]")}
      {...props}
    />
  );
});
FieldControl.displayName = "FieldControl";

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-xs text-slate-400", className)}
      {...props}
    />
  );
});
FieldDescription.displayName = "FieldDescription";

const FieldHint = FieldDescription; // Alias for description

const FieldMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FieldMessage.displayName = "FieldMessage";

const FieldCounter = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { current: number; max: number }
>(({ className, current, max, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        "text-xs text-right mt-1",
        current > max ? "text-destructive" : "text-foreground-subtle",
        className
      )}
      {...props}
    >
      {current} / {max}
    </p>
  );
});
FieldCounter.displayName = "FieldCounter";

export {
  useFormField,
  Form,
  FormItem,
  FieldRoot,
  FieldLabel,
  FieldControl,
  FieldDescription,
  FieldHint,
  FieldMessage,
  FieldCounter,
};
