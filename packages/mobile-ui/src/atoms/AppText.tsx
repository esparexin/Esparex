import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export interface AppTextProps extends RNTextProps {
  variant?: 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'label' | 'caption' | 'tiny';
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
      case 'display': return 'text-4xl leading-tight font-bold tracking-tight'; // 36px
      case 'h1': return 'text-3xl leading-snug font-bold tracking-tight'; // 30px
      case 'h2': return 'text-2xl leading-snug font-bold tracking-tight'; // 24px
      case 'h3': return 'text-xl leading-normal font-semibold tracking-tight'; // 20px
      case 'h4': return 'text-lg leading-normal font-semibold'; // 18px
      case 'body': return 'text-sm leading-normal'; // 14px
      case 'small': return 'text-small leading-normal'; // 13px
      case 'label': return 'text-sm font-medium leading-none'; // 14px
      case 'caption': return 'text-xs leading-tight'; // 12px
      case 'tiny': return 'text-tiny leading-tight'; // 11px
      default: return 'text-sm leading-normal';
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
