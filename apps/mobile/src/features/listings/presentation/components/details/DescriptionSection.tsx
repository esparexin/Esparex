import React from 'react';
import { View } from 'react-native';
import { AppText } from '@esparex/mobile-ui';

interface DescriptionSectionProps {
  description: string;
}

export const DescriptionSection = ({ description }: DescriptionSectionProps) => {
  if (!description) return null;

  return (
    <View className="px-4 py-4 bg-card border-b border-border">
      <AppText variant="h3" className="text-foreground font-semibold mb-3">
        Description
      </AppText>
      <AppText variant="body" className="text-foreground-secondary leading-relaxed">
        {description}
      </AppText>
    </View>
  );
};
