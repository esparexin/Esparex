import React from 'react';
import { View, ViewProps } from 'react-native';

export interface StackProps extends ViewProps {
  direction?: 'row' | 'col';
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  direction = 'col',
  spacing = 'md',
  align,
  justify,
  wrap = false,
  className = '',
  children,
  ...props
}) => {
  const isRow = direction === 'row';
  const base = isRow ? 'flex-row' : 'flex-col';
  const wrapClass = wrap ? 'flex-wrap' : '';

  let gapClass = '';
  switch (spacing) {
    case 'xs': gapClass = 'gap-1'; break;
    case 'sm': gapClass = 'gap-2'; break;
    case 'md': gapClass = 'gap-4'; break;
    case 'lg': gapClass = 'gap-6'; break;
    case 'xl': gapClass = 'gap-8'; break;
    case 'none':
    default: gapClass = ''; break;
  }

  let alignClass = '';
  if (align) {
    switch (align) {
      case 'start': alignClass = 'items-start'; break;
      case 'center': alignClass = 'items-center'; break;
      case 'end': alignClass = 'items-end'; break;
      case 'stretch': alignClass = 'items-stretch'; break;
      case 'baseline': alignClass = 'items-baseline'; break;
    }
  }

  let justifyClass = '';
  if (justify) {
    switch (justify) {
      case 'start': justifyClass = 'justify-start'; break;
      case 'center': justifyClass = 'justify-center'; break;
      case 'end': justifyClass = 'justify-end'; break;
      case 'between': justifyClass = 'justify-between'; break;
      case 'around': justifyClass = 'justify-around'; break;
      case 'evenly': justifyClass = 'justify-evenly'; break;
    }
  }

  return (
    <View 
      className={`${base} ${gapClass} ${alignClass} ${justifyClass} ${wrapClass} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};
