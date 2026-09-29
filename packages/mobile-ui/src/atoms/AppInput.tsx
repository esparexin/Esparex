import React, { forwardRef } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { AppText } from './AppText';

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const AppInput = forwardRef<TextInput, AppInputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const hasError = !!error;
  // RC-5 FIX: Replaced primitive palette classes (whose dark: variants were inert
  // when darkMode was absent from the NativeWind config) with semantic tokens that
  // now resolve to concrete hex values via the fixed tailwind.config.js.
  const baseInput = 'flex-1 h-12 text-body-lg text-foreground';
  const containerBase = 'flex-row items-center border rounded-lg bg-background px-3';

  const borderState = hasError
    ? 'border-destructive'
    : 'border-input focus:border-primary dark:focus:border-primary';

  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <AppText variant="label" className="mb-2 text-slate-700 dark:text-slate-300">
          {label}
        </AppText>
      )}
      <View className={`${containerBase} ${borderState}`}>
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          ref={ref}
          className={`${baseInput} ${className}`}
          placeholderTextColor="#94a3b8"
          accessibilityRole="text"
          accessibilityLabel={props.accessibilityLabel || label || props.placeholder}
          accessibilityState={{
            disabled: props.editable === false,
            ...(props.accessibilityState || {}),
          }}
          accessibilityHint={props.accessibilityHint || error}
          {...props}
        />
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>
      {error && (
        <AppText variant="caption" color="error" className="mt-1" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      )}
    </View>
  );
});

AppInput.displayName = 'AppInput';
