import React from 'react';
import { AppInput } from '@esparex/mobile-ui';
import { AppIcon } from '@esparex/mobile-ui';

interface TitleFieldProps {
  value: string | undefined;
  onChange: (text: string) => void;
}

/**
 * TitleField — stateless controlled text input for the listing title.
 *
 * Has no knowledge of the wizard, draft, or validation.
 * The parent (StepDetails) owns state and calls onChange on each keystroke.
 */
export const TitleField = ({ value, onChange }: TitleFieldProps) => {
  return (
    <AppInput
      label="Title"
      value={value ?? ''}
      onChangeText={onChange}
      placeholder="e.g. iPhone 14 Pro Max 256GB"
      returnKeyType="next"
      autoCapitalize="sentences"
      autoCorrect
      maxLength={120}
      leftIcon={<AppIcon name="Tag" size={16} color="#64748b" />}
      accessibilityLabel="Listing title"
      accessibilityHint="Describe what you are selling in a few words"
      containerClassName="mb-4"
    />
  );
};
