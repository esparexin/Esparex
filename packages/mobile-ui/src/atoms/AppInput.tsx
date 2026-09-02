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

export const AppInput = forwardRef<React.ComponentRef<typeof TextInput>, AppInputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const hasError = !!error;
  const baseInput = 'flex-1 h-12 text-base text-slate-900 dark:text-slate-100';
  const containerBase = 'flex-row items-center border rounded-lg bg-white dark:bg-slate-900 px-3';
  
  const borderState = hasError 
    ? 'border-error' 
    : 'border-slate-300 dark:border-slate-700 focus:border-brand-500 dark:focus:border-brand-400';

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
