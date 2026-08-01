import React from 'react';
import { View, ViewProps } from 'react-native';

export interface CenterProps extends ViewProps {
  className?: string;
}

export const Center: React.FC<CenterProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <View 
      className={`items-center justify-center ${className}`}
      {...(props as any)}
    >
      {children}
    </View>
  );
};
