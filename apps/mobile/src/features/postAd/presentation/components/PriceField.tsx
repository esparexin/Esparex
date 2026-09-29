import React from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';

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
      <AppText variant="caption" className="font-semibold text-foreground mb-1.5">
        Price (₹) <AppText className="text-destructive">*</AppText>
      </AppText>

      {/* Side-by-side Price Input and Mark as Free Toggle */}
      <View className="flex-row items-center gap-3">
        {/* Left: Price Input */}
        <View
          className={`flex-1 flex-row items-center px-3.5 py-3 rounded-xl border ${
            isFree
              ? 'bg-muted border-border'
              : 'bg-card border-border'
          }`}
        >
          <AppText variant="body" className={`font-bold mr-2 ${isFree ? 'text-muted-foreground' : 'text-foreground-secondary'}`}>
            ₹
          </AppText>
          <TextInput
            value={isFree ? '0' : value !== undefined && value > 0 ? String(value) : ''}
            onChangeText={handleChange}
            placeholder="0.00"
            placeholderTextColor={base.slate[500]}
            keyboardType="decimal-pad"
            returnKeyType="next"
            maxLength={10}
            editable={!isFree}
            className={`flex-1 font-semibold text-body-lg p-0 ${isFree ? 'text-muted-foreground' : 'text-foreground'}`}
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
                ? 'bg-success/10 border-success'
                : 'bg-card border-border'
            }`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isFree }}
            accessibilityLabel="Mark as free"
          >
            <AppIcon
              name={isFree ? 'CheckSquare' : 'Square'}
              size={16}
              color={isFree ? base.success : base.slate[500]}
            />
            <AppText
              variant="caption"
              className={`ml-2 font-semibold text-xs ${
                isFree ? 'text-success' : 'text-foreground-secondary'
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
