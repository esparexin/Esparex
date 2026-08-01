import React from 'react';
import { View, ViewProps } from 'react-native';

export interface ContainerProps extends ViewProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padded?: boolean;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  maxWidth = 'full',
  padded = true,
  className = '',
  children,
  ...props
}) => {
  let maxWidthClass = 'w-full';
  switch (maxWidth) {
    case 'sm': maxWidthClass = 'w-full max-w-sm self-center'; break;
    case 'md': maxWidthClass = 'w-full max-w-md self-center'; break;
    case 'lg': maxWidthClass = 'w-full max-w-lg self-center'; break;
    case 'xl': maxWidthClass = 'w-full max-w-xl self-center'; break;
  }

  const paddingClass = padded ? 'px-4' : '';

  return (
    <View 
      className={`${maxWidthClass} ${paddingClass} ${className}`}
      {...(props as any)}
    >
      {children}
    </View>
  );
};
