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
    <View className="mb-5 p-4 rounded-2xl bg-card border border-border">
      <AppText variant="body" className="font-bold text-foreground mb-1">
        Working / Available Spare Parts
      </AppText>
      <AppText variant="caption" className="text-foreground-secondary mb-3">
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
                  ? 'bg-success/10 border-success'
                  : 'bg-muted border-border'
              }`}
            >
              <AppIcon
                name={isChecked ? 'CheckCircle2' : 'Plus'}
                size={14}
                color={isChecked ? base.success : base.slate[500]}
              />
              <AppText
                variant="caption"
                className={`ml-1.5 font-medium ${
                  isChecked
                    ? 'text-success font-semibold'
                    : 'text-foreground-secondary'
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
