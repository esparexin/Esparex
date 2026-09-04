import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { Screen, ScreenProps } from './Screen';

export interface ScrollScreenProps extends ScreenProps {
  scrollViewProps?: ScrollViewProps;
  contentContainerClassName?: string;
}

export const ScrollScreen: React.FC<ScrollScreenProps> = ({
  children,
  scrollViewProps,
  contentContainerClassName = '',
  ...screenProps
}) => {
  return (
    <Screen {...screenProps}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
        contentContainerClassName={`grow p-4 ${contentContainerClassName}`}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </Screen>
  );
};
