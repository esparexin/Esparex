import React from 'react';
import { View, ViewProps } from 'react-native';

export interface DividerProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  className = '',
  ...props
}) => {
  const baseStyle = 'bg-slate-200 dark:bg-slate-800';
  const orientationStyle = orientation === 'horizontal' ? 'w-full h-[1px]' : 'h-full w-[1px]';

  return (
    <View 
      className={`${baseStyle} ${orientationStyle} ${className}`}
      {...props}
    />
  );
};
