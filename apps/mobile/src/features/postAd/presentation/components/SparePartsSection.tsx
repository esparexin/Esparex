import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import type { CatalogSparePart } from '../hooks/useCategoryDependents';

interface SparePartsSectionProps {
  spareParts: CatalogSparePart[];
  selectedSpareParts: string[];
  onToggleSparePart: (partId: string) => void;
}

export const SparePartsSection = ({
  spareParts,
  selectedSpareParts,
  onToggleSparePart,
}: SparePartsSectionProps) => {
  if (spareParts.length === 0) return null;

  return (
    <View className="mb-5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <AppText variant="body" className="font-bold text-slate-900 dark:text-white mb-1">
        Working / Available Spare Parts
      </AppText>
      <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mb-3">
        Select the functional parts available with this device.
      </AppText>

      <View className="flex-row flex-wrap gap-2">
        {spareParts.map((part) => {
          const isChecked = selectedSpareParts.includes(part.id);
          return (
            <TouchableOpacity
              key={part.id}
              onPress={() => onToggleSparePart(part.id)}
              className={`px-3 py-2 rounded-xl border flex-row items-center ${
                isChecked
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <AppIcon
                name={isChecked ? 'CheckCircle2' : 'Plus'}
                size={14}
                color={isChecked ? '#059669' : base.slate[400]}
              />
              <AppText
                variant="caption"
                className={`ml-1.5 font-medium ${
                  isChecked
                    ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {part.name}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
