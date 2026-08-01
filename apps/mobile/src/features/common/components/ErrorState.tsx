import React from 'react';
import { Center, AppText, AppIcon, AppButton } from '@esparex/mobile-ui';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title = 'Something went wrong', 
  message = 'We encountered an error loading this content.',
  onRetry
}) => (
  <Center className="flex-1 p-6">
    <Center className="w-16 h-16 rounded-full bg-red-500/10 mb-4">
      <AppIcon name="AlertCircle" size={32} color="#ef4444" />
    </Center>
    <AppText variant="h3" className="text-slate-200 text-center mb-2">
      {title}
    </AppText>
    <AppText variant="body" className="text-slate-400 text-center mb-6">
      {message}
    </AppText>
    {onRetry && (
      <AppButton 
        label="Try Again" 
        variant="outline" 
        onPress={onRetry} 
      />
    )}
  </Center>
);
