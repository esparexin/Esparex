import React from 'react';
import { View } from 'react-native';
import { AppText } from '@esparex/mobile-ui';

interface DescriptionSectionProps {
  description: string;
}

export const DescriptionSection = ({ description }: DescriptionSectionProps) => {
  if (!description) return null;

  return (
    <View className="px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <AppText variant="h3" className="text-slate-900 dark:text-white font-semibold mb-3">
        Description
      </AppText>
      <AppText variant="body" className="text-slate-700 dark:text-slate-300 leading-relaxed">
        {description}
      </AppText>
    </View>
  );
};
