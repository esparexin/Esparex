import React from 'react';
import { ViewProps } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar, StatusBarStyle } from 'expo-status-bar';

export interface ScreenProps extends ViewProps {
  edges?: Edge[];
  backgroundColor?: string;
  barStyle?: 'default' | 'light-content' | 'dark-content' | StatusBarStyle;
  className?: string;
}

export const Screen: React.FC<ScreenProps> = ({
  edges = ['top', 'bottom', 'left', 'right'],
  backgroundColor = 'bg-white dark:bg-slate-900',
  barStyle = 'default',
  className = '',
  children,
  ...props
}) => {
  const statusBarStyle: StatusBarStyle =
    barStyle === 'light-content' ? 'light' : barStyle === 'dark-content' ? 'dark' : barStyle === 'default' ? 'auto' : (barStyle as StatusBarStyle);

  return (
    <SafeAreaView 
      edges={edges}
      className={`flex-1 ${backgroundColor} ${className}`}
      {...(props as any)}
    >
      <StatusBar style={statusBarStyle} />
      {children}
    </SafeAreaView>
  );
};
