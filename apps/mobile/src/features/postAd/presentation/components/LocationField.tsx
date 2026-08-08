import React from 'react';
import { AppInput, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';

interface LocationFieldProps {
  locationDisplay: string | undefined;
  onChange: (display: string) => void;
}

/**
 * LocationField — stateless text input for a human-readable location.
 *
 * A simple text field for now. In a future enhancement this could open
 * a location picker sheet that populates both `locationId` and
 * `locationDisplay` — without changing this component's onChange signature.
 */
export const LocationField = ({ locationDisplay, onChange }: LocationFieldProps) => {
  return (
    <AppInput
      label="Location"
      value={locationDisplay ?? ''}
      onChangeText={onChange}
      placeholder="e.g. Mumbai, Maharashtra"
      returnKeyType="next"
      autoCapitalize="words"
      leftIcon={<AppIcon name="MapPin" size={16} color={base.slate[400]} />}
      accessibilityLabel="Item location"
      accessibilityHint="Enter the city or area where the item is located"
      containerClassName="mb-4"
    />
  );
};
