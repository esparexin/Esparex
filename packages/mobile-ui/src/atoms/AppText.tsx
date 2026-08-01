import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export interface AppTextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'label' | 'caption';
  color?: 'default' | 'muted' | 'brand' | 'error' | 'success';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color = 'default',
  weight = 'normal',
  align = 'left',
  className = '',
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'h1': return 'text-4xl leading-tight font-bold tracking-tight';
      case 'h2': return 'text-3xl leading-snug font-bold tracking-tight';
      case 'h3': return 'text-2xl leading-normal font-semibold tracking-tight';
      case 'h4': return 'text-xl leading-normal font-semibold';
      case 'label': return 'text-sm font-medium leading-none';
      case 'caption': return 'text-xs leading-tight';
      case 'body':
      default: return 'text-base leading-normal';
    }
  };

  const getColorStyles = () => {
    switch (color) {
      case 'muted': return 'text-slate-500 dark:text-slate-400';
      case 'brand': return 'text-brand-600 dark:text-brand-400';
      case 'error': return 'text-error';
      case 'success': return 'text-success';
      case 'default':
      default: return 'text-slate-900 dark:text-slate-50';
    }
  };

  const getWeightStyles = () => {
    switch (weight) {
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      case 'normal':
      default: return 'font-normal';
    }
  };

  const getAlignStyles = () => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      case 'left':
      default: return 'text-left';
    }
  };

  // We combine the base classes. The `weight` prop overrides the variant's default weight if provided explicitly.
  // In a real app, you might use `tailwind-merge` or `clsx` for cleaner class merging.
  const classes = [
    getVariantStyles(),
    getColorStyles(),
    getWeightStyles(),
    getAlignStyles(),
    className
  ].filter(Boolean).join(' ');

  return (
    <RNText className={classes} style={style} {...(props as any)} />
  );
};
