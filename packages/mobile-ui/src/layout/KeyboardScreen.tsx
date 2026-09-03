import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollViewProps } from 'react-native';
import { ScrollScreen, ScrollScreenProps } from './ScrollScreen';

export interface KeyboardScreenProps extends ScrollScreenProps {
  behavior?: 'padding' | 'height' | 'position';
  keyboardVerticalOffset?: number;
}

export const KeyboardScreen: React.FC<KeyboardScreenProps> = ({
  behavior = Platform.OS === 'ios' ? 'padding' : undefined,
  keyboardVerticalOffset = 0,
  children,
  ...props
}) => {
  return (
    <KeyboardAvoidingView 
      className="flex-1"
      behavior={behavior} 
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollScreen {...props}>
        {children}
      </ScrollScreen>
    </KeyboardAvoidingView>
  );
};
