import React from 'react';
import { View, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'ghost';
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
      case 'sm': return 'shadow-sm';
      case 'none':
      default: return '';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined': return 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
      case 'ghost': return 'bg-slate-50 dark:bg-slate-800/50';
      case 'default':
      default: return 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800';
    }
  };

  return (
    <View 
      className={`rounded-xl overflow-hidden p-4 ${getVariantStyles()} ${getElevationStyles()} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};
