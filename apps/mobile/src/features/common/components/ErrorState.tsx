import React from 'react';
import { Center, AppText, AppIcon, AppButton } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';

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
    <Center className="w-16 h-16 rounded-full bg-destructive/10 mb-4">
      <AppIcon name="AlertCircle" size={32} color={base.error} />
    </Center>
    <AppText variant="h3" className="text-foreground text-center mb-2">
      {title}
    </AppText>
    <AppText variant="body" className="text-foreground-secondary text-center mb-6">
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
