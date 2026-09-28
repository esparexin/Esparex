import React from 'react';
import { View, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'ghost' | 'soft';
  padded?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  elevation = 'sm', 
  variant = 'default',
  padded = true,
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
      case 'outlined': return 'border border-border bg-transparent';
      case 'soft': return 'bg-muted border border-border';
      case 'ghost': return 'bg-muted/50 border-0';
      case 'default':
      default: return 'bg-card border border-border';
    }
  };

  return (
    <View 
      className={`rounded-xl overflow-hidden ${padded ? 'p-3.5' : ''} ${getVariantStyles()} ${getElevationStyles()} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};

