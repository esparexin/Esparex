import React from 'react';
import { View } from 'react-native';
import { AppText } from '@esparex/mobile-ui';
import { ListingAttribute } from './ListingAttribute';

interface AttributesSectionProps {
  attributes: Array<{ label: string; value: string }>;
}

export const AttributesSection = ({ attributes }: AttributesSectionProps) => {
  if (!attributes || attributes.length === 0) return null;

  return (
    <View className="px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <AppText variant="h3" className="text-slate-900 dark:text-white font-semibold mb-2">
        Details
      </AppText>
      <View className="mt-2">
        {attributes.map((attr, index) => (
          <ListingAttribute key={`${attr.label}-${index}`} label={attr.label} value={attr.value} />
        ))}
      </View>
    </View>
  );
};
