import React from 'react';
import { View, ViewProps } from 'react-native';

export interface SpacerProps extends ViewProps {
  flex?: number | boolean;
  size?: number | string;
  horizontal?: boolean;
  className?: string;
}

export const Spacer: React.FC<SpacerProps> = ({
  flex = false,
  size,
  horizontal = false,
  className = '',
  style,
  ...props
}) => {
  let combinedStyle: any = typeof style === 'object' ? { ...style } : [style];
  
  if (flex) {
    combinedStyle.flex = typeof flex === 'number' ? flex : 1;
  }
  
  if (size !== undefined) {
    if (horizontal) {
      combinedStyle.width = size;
    } else {
      combinedStyle.height = size;
    }
  }

  return (
    <View 
      style={combinedStyle}
      className={className}
      {...(props as any)}
    />
  );
};
