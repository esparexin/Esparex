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
    <View className="mb-5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <AppText variant="body" className="font-bold text-slate-900 dark:text-white mb-2">
        Device Condition
      </AppText>
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => onSelectCondition('power_on')}
          className={`flex-1 p-3 rounded-xl border items-center ${
            selectedCondition === 'power_on'
              ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}
        >
          <AppIcon
            name="CheckCircle2"
            size={18}
            color={selectedCondition === 'power_on' ? base.brand[600] : base.slate[400]}
          />
          <AppText
            variant="caption"
            className={`mt-1 font-semibold ${
              selectedCondition === 'power_on'
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            Power On (Working)
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelectCondition('power_off')}
          className={`flex-1 p-3 rounded-xl border items-center ${
            selectedCondition === 'power_off'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}
        >
          <AppIcon
            name="AlertCircle"
            size={18}
            color={selectedCondition === 'power_off' ? '#d97706' : base.slate[400]}
          />
          <AppText
            variant="caption"
            className={`mt-1 font-semibold ${
              selectedCondition === 'power_off'
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            Power Off (For Parts)
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
};
