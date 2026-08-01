import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from '@esparex/mobile-ui';

interface ConditionFieldProps {
  value: string | undefined;
  onChange: (condition: string) => void;
}

/**
 * Condition options for a second-hand listing.
 * Defined as a module constant — not imported from anywhere —
 * because they are a UI concern, not a business contract.
 */
const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'for_parts', label: 'For Parts' },
] as const;

/**
 * ConditionField — stateless horizontal chip selector for item condition.
 *
 * Uses accessibilityRole="radio" on each chip so screen readers announce
 * the group correctly. The parent (StepDetails) owns selection state.
 */
export const ConditionField = ({ value, onChange }: ConditionFieldProps) => {
  return (
    <View className="mb-4">
      <AppText
        variant="label"
        className="mb-2 text-slate-700 dark:text-slate-300"
      >
        Condition
      </AppText>

      <View
        className="flex-row flex-wrap gap-2"
        accessibilityRole="radiogroup"
        accessibilityLabel="Item condition"
      >
        {CONDITIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange(option.value)}
              accessible
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: isSelected }}
              activeOpacity={0.7}
              className={[
                'px-4 py-2 rounded-full border',
                isSelected
                  ? 'bg-sky-500 border-sky-500'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600',
              ].join(' ')}
            >
              <AppText
                variant="caption"
                className={
                  isSelected
                    ? 'text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300'
                }
              >
                {option.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
