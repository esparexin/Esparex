import React from 'react';
import { icons } from '../tokens';
import * as LucideIcons from 'lucide-react-native';

export type IconName = keyof typeof LucideIcons;

export interface AppIconProps {
  name: IconName;
  size?: keyof typeof icons.sizes | number;
  color?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ 
  name, 
  size = 'md', 
  color = 'currentColor' 
}) => {
  const IconComponent = LucideIcons[name] as React.ElementType;
  
  if (!IconComponent) {
    console.warn(`Icon ${name} not found in lucide-react-native`);
    return null;
  }
  
  const iconSize = typeof size === 'number' ? size : icons.sizes[size];

  return <IconComponent size={iconSize} color={color} />;
};
