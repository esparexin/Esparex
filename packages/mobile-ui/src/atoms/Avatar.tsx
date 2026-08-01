import React from 'react';
import { View, Image, ViewProps } from 'react-native';
import { AppText } from './AppText';

export interface AvatarProps extends ViewProps {
  src?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  fallback,
  size = 'md',
  className = '',
  ...props
}) => {
  let sizeStyles = '';
  let textStyles = '';
  
  switch (size) {
    case 'sm': 
      sizeStyles = 'w-8 h-8'; 
      textStyles = 'text-xs';
      break;
    case 'lg': 
      sizeStyles = 'w-12 h-12'; 
      textStyles = 'text-lg';
      break;
    case 'xl': 
      sizeStyles = 'w-16 h-16'; 
      textStyles = 'text-2xl';
      break;
    case 'md':
    default: 
      sizeStyles = 'w-10 h-10'; 
      textStyles = 'text-base';
      break;
  }

  const baseContainer = `rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 items-center justify-center ${sizeStyles} ${className}`;

  if (src) {
    return (
      <View className={baseContainer} {...(props as any)}>
        <Image source={{ uri: src }} className="w-full h-full" {...({} as any)} />
      </View>
    );
  }

  return (
    <View className={baseContainer} {...(props as any)}>
      <AppText className={`${textStyles} font-semibold text-slate-600 dark:text-slate-300 uppercase`}>
        {fallback ? fallback.substring(0, 2) : '?'}
      </AppText>
    </View>
  );
};
