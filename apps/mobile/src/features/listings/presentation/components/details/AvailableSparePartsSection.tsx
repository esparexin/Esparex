import React from 'react';
import { View } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { base, semantic } from '@esparex/design-tokens';
import { ListingSparePart } from '../../../domain/Listing';

interface AvailableSparePartsSectionProps {
  spareParts?: ListingSparePart[];
}

export const AvailableSparePartsSection = ({ spareParts }: AvailableSparePartsSectionProps) => {
  if (!spareParts || spareParts.length === 0) {
    return null;
  }

  return (
    <View className="px-4 py-4 bg-card border-b border-border">
      <View className="flex-row items-center mb-2.5">
        <View className="mr-1.5">
          <AppIcon name="Cpu" size={16} color={base.brand[600]} />
        </View>
        <AppText variant="h4" className="text-foreground font-semibold">
          Available Spare Parts
        </AppText>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {spareParts.map((part) => (
          <View
            key={part.id || part.name}
            className="px-3 py-1.5 rounded-xl bg-muted border border-border flex-row items-center"
          >
            <View className="mr-1.5">
              <AppIcon name="CheckCircle2" size={12} color={semantic.light.success} />
            </View>
            <AppText variant="caption" className="text-foreground-secondary font-medium">
              {part.name}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
};
