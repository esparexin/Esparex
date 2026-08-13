import React from 'react';
import { View, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'ghost' | 'soft';
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  elevation = 'sm', 
  variant = 'default',
  className = '', 
  children, 
  ...props 
}) => {
  
  const getElevationStyles = () => {
    switch (elevation) {
      case 'lg': return 'shadow-lg';
      case 'md': return 'shadow-md';
      case 'sm': return 'shadow-2xs';
      case 'none':
      default: return '';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined': return 'border border-slate-200/80 dark:border-slate-800/80 bg-transparent';
      case 'soft': return 'bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50';
      case 'ghost': return 'bg-slate-50/50 dark:bg-slate-800/30 border-0';
      case 'default':
      default: return 'bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80';
    }
  };

  return (
    <View 
      className={`rounded-xl overflow-hidden p-3.5 ${getVariantStyles()} ${getElevationStyles()} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};

