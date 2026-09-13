import React from 'react';
import { Center, AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import type { IconName } from '@esparex/mobile-ui/src/atoms/AppIcon';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: IconName;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description,
  icon = 'Inbox'
}) => (
  <Center className="flex-1 p-6">
    <Center className="w-16 h-16 rounded-full bg-muted mb-4">
      <AppIcon name={icon} size={32} color={base.slate[400]} />
    </Center>
    <AppText variant="h3" className="text-foreground text-center mb-2">
      {title}
    </AppText>
    <AppText variant="body" className="text-foreground-subtle text-center">
      {description}
    </AppText>
  </Center>
);
