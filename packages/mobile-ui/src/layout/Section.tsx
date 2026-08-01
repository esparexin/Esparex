import React from 'react';
import { View, ViewProps } from 'react-native';

export interface SectionProps extends ViewProps {
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  title?: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  spacing = 'lg',
  className = '',
  children,
  title,
  ...props
}) => {
  let spacingClass = '';
  switch (spacing) {
    case 'sm': spacingClass = 'mb-4'; break;
    case 'md': spacingClass = 'mb-6'; break;
    case 'lg': spacingClass = 'mb-8'; break;
    case 'xl': spacingClass = 'mb-12'; break;
    case 'none':
    default: spacingClass = ''; break;
  }

  return (
    <View 
      className={`${spacingClass} w-full ${className}`}
      {...(props as any)}
    >
      {title && <View className="mb-3" {...({} as any)}>{title}</View>}
      {children}
    </View>
  );
};
