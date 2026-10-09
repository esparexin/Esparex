import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export interface AppTextProps extends RNTextProps {
  variant?: 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body-lg' | 'body' | 'small' | 'label' | 'caption' | 'tiny';
  color?: 'default' | 'secondary' | 'muted' | 'brand' | 'error' | 'success';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  className?: string;
}

const normalizeTextChildren = (children: React.ReactNode): React.ReactNode => {
  if (Array.isArray(children)) {
    if (children.every((child) => typeof child === 'string' || typeof child === 'number' || child === null || child === undefined)) {
      return children.filter((c) => c !== null && c !== undefined).join('');
    }
  }
  return children;
};

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color = 'default',
  weight = 'normal',
  align = 'left',
  className = '',
  style,
  children,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'display': return 'text-display leading-tight font-bold tracking-tight'; // 36px
      case 'h1': return 'text-h1 leading-snug font-bold tracking-tight'; // 30px
      case 'h2': return 'text-h2 leading-snug font-bold tracking-tight'; // 24px
      case 'h3': return 'text-h3 leading-normal font-semibold tracking-tight'; // 20px
      case 'h4': return 'text-h4 leading-normal font-semibold'; // 18px
      case 'body-lg': return 'text-body-lg leading-normal'; // 16px
      case 'body': return 'text-body leading-normal'; // 14px
      case 'small': return 'text-small leading-normal'; // 13px
      case 'label': return 'text-body font-medium leading-none'; // 14px
      case 'caption': return 'text-caption leading-tight'; // 12px
      case 'tiny': return 'text-tiny leading-tight'; // 11px
      default: return 'text-body leading-normal';
    }
  };

  const getColorStyles = () => {
    switch (color) {
      case 'secondary': return 'text-foreground-secondary';
      case 'muted': return 'text-muted-foreground';
      case 'brand': return 'text-brand-600';
      case 'error': return 'text-destructive';
      case 'success': return 'text-success';
      case 'default': return 'text-foreground';
      // RC-5 FIX: Use semantic text-foreground instead of the primitive
      // palette classes whose dark: variants were inert without darkMode (RC-1).
      // text-foreground resolves to a concrete hex via the fixed NativeWind config.
      default: return 'text-foreground';
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
    <RNText className={classes} style={style} {...props}>
      {normalizeTextChildren(children)}
    </RNText>
  );
};
