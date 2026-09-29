import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';

interface DeviceConditionSectionProps {
  selectedCondition?: 'power_on' | 'power_off';
  onSelectCondition: (condition: 'power_on' | 'power_off') => void;
}

export const DeviceConditionSection = ({
  selectedCondition,
  onSelectCondition,
}: DeviceConditionSectionProps) => {
  return (
    <View className="mb-5 p-4 rounded-2xl bg-card border border-border">
      <AppText variant="body" className="font-bold text-foreground mb-2">
        Device Condition
      </AppText>
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => onSelectCondition('power_on')}
          className={`flex-1 p-3 rounded-xl border items-center ${
            selectedCondition === 'power_on'
              ? 'bg-brand-50 border-brand-500'
              : 'bg-muted border-border'
          }`}
        >
          <AppIcon
            name="CheckCircle2"
            size={18}
            color={selectedCondition === 'power_on' ? base.brand[600] : base.slate[500]}
          />
          <AppText
            variant="caption"
            className={`mt-1 font-semibold ${
              selectedCondition === 'power_on'
                ? 'text-brand-700'
                : 'text-foreground-secondary'
            }`}
          >
            Power On (Working)
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelectCondition('power_off')}
          className={`flex-1 p-3 rounded-xl border items-center ${
            selectedCondition === 'power_off'
              ? 'bg-warning/10 border-warning'
              : 'bg-muted border-border'
          }`}
        >
          <AppIcon
            name="AlertCircle"
            size={18}
            color={selectedCondition === 'power_off' ? base.warning : base.slate[500]}
          />
          <AppText
            variant="caption"
            className={`mt-1 font-semibold ${
              selectedCondition === 'power_off'
                ? 'text-warning'
                : 'text-foreground-secondary'
            }`}
          >
            Power Off (For Parts)
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
};
