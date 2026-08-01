import React from 'react';
import { AppInput, AppText } from '@esparex/mobile-ui';

interface PriceFieldProps {
  value: number | undefined;
  onChange: (price: number) => void;
}

/**
 * PriceField — stateless controlled numeric input for the listing price.
 *
 * Converts the string from TextInput to a number before calling onChange.
 * Passes `undefined` back to the parent when the field is empty so the
 * draft remains clean rather than holding NaN.
 */
export const PriceField = ({ value, onChange }: PriceFieldProps) => {
  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <AppInput
      label="Price"
      value={value !== undefined ? String(value) : ''}
      onChangeText={handleChange}
      placeholder="0.00"
      keyboardType="decimal-pad"
      returnKeyType="next"
      maxLength={12}
      leftIcon={
        <AppText variant="body" className="text-slate-500 dark:text-slate-400 font-semibold">
          ₹
        </AppText>
      }
      accessibilityLabel="Listing price"
      accessibilityHint="Enter the price in rupees"
      containerClassName="mb-4"
    />
  );
};
