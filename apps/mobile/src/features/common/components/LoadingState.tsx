import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Center, AppText } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => (
  <Center className="flex-1 p-6">
    <ActivityIndicator size="large" color={base.brand[500]} />
    <AppText variant="body" className="text-slate-400 mt-4 text-center">
      {message}
    </AppText>
  </Center>
);

