import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { LocationMeta } from '@esparex/contracts';

export const POPULAR_METROS: LocationMeta[] = [
  { locationId: 'loc-hyd', city: 'Hyderabad', state: 'Telangana', display: 'Hyderabad, Telangana' },
  { locationId: 'loc-blr', city: 'Bengaluru', state: 'Karnataka', display: 'Bengaluru, Karnataka' },
  { locationId: 'loc-mum', city: 'Mumbai', state: 'Maharashtra', display: 'Mumbai, Maharashtra' },
  { locationId: 'loc-del', city: 'Delhi', state: 'Delhi', display: 'Delhi NCR' },
  { locationId: 'loc-che', city: 'Chennai', state: 'Tamil Nadu', display: 'Chennai, Tamil Nadu' },
  { locationId: 'loc-pun', city: 'Pune', state: 'Maharashtra', display: 'Pune, Maharashtra' },
  { locationId: 'loc-kol', city: 'Kolkata', state: 'West Bengal', display: 'Kolkata, West Bengal' },
  { locationId: 'loc-ahm', city: 'Ahmedabad', state: 'Gujarat', display: 'Ahmedabad, Gujarat' },
];

interface PopularMetrosChipsProps {
  selectedLocationId?: string;
  onSelect: (metro: LocationMeta) => void;
}

export const PopularMetrosChips: React.FC<PopularMetrosChipsProps> = ({
  selectedLocationId,
  onSelect,
}) => {
  return (
    <View className="mb-4">
      <AppText
        variant="caption"
        className="text-foreground-subtle uppercase font-semibold tracking-wider mb-2 px-1"
      >
        Popular Cities
      </AppText>
      <View className="flex-row flex-wrap gap-2">
        {POPULAR_METROS.map((metro) => {
          const isSelected = selectedLocationId === metro.locationId || selectedLocationId === metro.city;
          return (
            <TouchableOpacity
              key={metro.locationId || metro.city}
              onPress={() => onSelect(metro)}
              className={`flex-row items-center px-3 py-2 rounded-xl border ${
                isSelected
                  ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700'
                  : 'bg-muted border-border'
              }`}
              accessibilityRole="button"
              accessibilityLabel={`Select ${metro.display}`}
            >
              <AppIcon
                name="MapPin"
                size={13}
                color={isSelected ? base.brand[600] : base.slate[500]}
              />
              <AppText
                variant="caption"
                className={`font-semibold ml-1.5 ${
                  isSelected
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-foreground-secondary'
                }`}
              >
                {metro.city}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
