import React from 'react';
import { View } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { ListingSparePart } from '../../../domain/Listing';

interface AvailableSparePartsSectionProps {
  spareParts?: ListingSparePart[];
}

export const AvailableSparePartsSection = ({ spareParts }: AvailableSparePartsSectionProps) => {
  if (!spareParts || spareParts.length === 0) {
    return null;
  }

  return (
    <View className="px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <View className="flex-row items-center mb-2.5">
        <View className="mr-1.5">
          <AppIcon name="Cpu" size={16} color="#0ea5e9" />
        </View>
        <AppText variant="h4" className="text-slate-900 dark:text-white font-semibold">
          Available Spare Parts
        </AppText>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {spareParts.map((part) => (
          <View
            key={part.id || part.name}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-row items-center"
          >
            <View className="mr-1.5">
              <AppIcon name="CheckCircle2" size={12} color="#10b981" />
            </View>
            <AppText variant="caption" className="text-slate-700 dark:text-slate-200 font-medium">
              {part.name}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
};
