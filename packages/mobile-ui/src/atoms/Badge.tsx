import React from 'react';
import { View, ViewProps } from 'react-native';
import { AppText } from './AppText';

export interface BadgeProps extends ViewProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'brand';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success': return 'bg-success/10 border-success/20';
      case 'warning': return 'bg-warning/10 border-warning/20';
      case 'error': return 'bg-error/10 border-error/20';
      case 'brand': return 'bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:border-brand-800';
      case 'default':
      default: return 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-error';
      case 'brand': return 'text-brand-700 dark:text-brand-300';
      case 'default':
      default: return 'text-slate-700 dark:text-slate-300';
    }
  };

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const textSize = size === 'sm' ? 'text-tiny' : 'text-caption';

  return (
    <View 
      className={`rounded-full border flex-row items-center justify-center self-start ${getVariantStyles()} ${sizeStyles} ${className}`}
      {...props}
    >
      <AppText className={`${getTextColor()} ${textSize} font-medium tracking-wide uppercase`}>
        {label}
      </AppText>
    </View>
  );
};
