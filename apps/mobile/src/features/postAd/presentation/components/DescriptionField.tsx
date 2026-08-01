import React from 'react';
import { AppInput } from '@esparex/mobile-ui';

interface DescriptionFieldProps {
  value: string | undefined;
  onChange: (text: string) => void;
}

/**
 * DescriptionField — stateless multiline text input for the listing description.
 *
 * Multiline TextInput in React Native grows with content but the
 * maxLength guard prevents excessively long submissions.
 */
export const DescriptionField = ({ value, onChange }: DescriptionFieldProps) => {
  return (
    <AppInput
      label="Description"
      value={value ?? ''}
      onChangeText={onChange}
      placeholder="Describe the item — include brand, model, any defects, accessories included, reason for selling…"
      multiline
      numberOfLines={5}
      maxLength={2000}
      autoCapitalize="sentences"
      autoCorrect
      className="h-32 pt-2"
      accessibilityLabel="Listing description"
      accessibilityHint="Optional. Provide more detail about the item"
      containerClassName="mb-4"
    />
  );
};
