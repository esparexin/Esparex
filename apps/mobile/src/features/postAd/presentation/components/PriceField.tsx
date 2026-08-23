import React from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';

interface PriceFieldProps {
  value: number | undefined;
  isFree?: boolean;
  onChange: (price: number) => void;
  onToggleFree?: (isFree: boolean) => void;
}

export const PriceField = ({
  value,
  isFree = false,
  onChange,
  onToggleFree,
}: PriceFieldProps) => {
  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else {
      onChange(0);
    }
  };

  return (
    <View className="mb-4">
      <AppText variant="caption" className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
        Price (₹) <AppText className="text-red-500">*</AppText>
      </AppText>

      {/* Side-by-side Price Input and Mark as Free Toggle */}
      <View className="flex-row items-center gap-3">
        {/* Left: Price Input */}
        <View
          className={`flex-1 flex-row items-center px-3.5 py-3 rounded-xl border ${
            isFree
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <AppText variant="body" className="font-bold text-slate-700 dark:text-slate-300 mr-2">
            ₹
          </AppText>
          <TextInput
            value={isFree ? '0' : value !== undefined && value > 0 ? String(value) : ''}
            onChangeText={handleChange}
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            returnKeyType="next"
            maxLength={10}
            editable={!isFree}
            className="flex-1 text-slate-900 dark:text-white font-semibold text-base p-0"
            accessibilityLabel="Listing price"
          />
        </View>

        {/* Right: Mark as Free Pill Checkbox */}
        {onToggleFree && (
          <TouchableOpacity
            onPress={() => onToggleFree(!isFree)}
            activeOpacity={0.7}
            className={`px-3.5 py-3 rounded-xl border flex-row items-center justify-center ${
              isFree
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isFree }}
            accessibilityLabel="Mark as free"
          >
            <AppIcon
              name={isFree ? 'CheckSquare' : 'Square'}
              size={16}
              color={isFree ? '#059669' : '#64748b'}
            />
            <AppText
              variant="caption"
              className={`ml-2 font-semibold text-xs ${
                isFree ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              Mark as Free
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
