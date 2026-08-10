import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View, ActivityIndicator } from 'react-native';
import { AppText } from './AppText';

export interface AppButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  label,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const getContainerStyles = () => {
    const base = 'flex-row items-center justify-center rounded-lg';
    const state = (disabled || loading) ? 'opacity-50' : 'opacity-100';

    let sizeStyles = '';
    switch (size) {
      case 'sm': sizeStyles = 'px-3 py-2 min-h-[44px] min-w-[44px]'; break;
      case 'lg': sizeStyles = 'px-8 py-4'; break;
      case 'md':
      default: sizeStyles = 'px-4 py-3'; break;
    }

    let variantStyles = '';
    switch (variant) {
      case 'secondary': variantStyles = 'bg-slate-100 dark:bg-slate-800'; break;
      case 'outline': variantStyles = 'border border-slate-300 dark:border-slate-700 bg-transparent'; break;
      case 'ghost': variantStyles = 'bg-transparent'; break;
      case 'destructive': variantStyles = 'bg-error'; break;
      case 'primary':
      default: variantStyles = 'bg-brand-600 dark:bg-brand-500'; break;
    }

    return [base, sizeStyles, variantStyles, state, className].filter(Boolean).join(' ');
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return 'text-brand-600 dark:text-brand-400';
      case 'secondary':
        return 'text-slate-900 dark:text-slate-100';
      case 'destructive':
        return 'text-white';
      case 'primary':
      default:
        return 'text-white dark:text-slate-950';
    }
  };

  const textStyle = `${getTextColor()} font-semibold ${size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-sm' : 'text-base'}`;

  const computedHitSlop = props.hitSlop || (size === 'sm' ? { top: 8, bottom: 8, left: 8, right: 8 } : undefined);

  return (
    <TouchableOpacity
      className={getContainerStyles()}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel || label}
      accessibilityState={{
        disabled: !!(disabled || loading),
        busy: !!loading,
        ...(props.accessibilityState || {}),
      }}
      hitSlop={computedHitSlop}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#0284c7' : '#fff'} />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          {label ? <AppText className={textStyle}>{label}</AppText> : children}
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};
