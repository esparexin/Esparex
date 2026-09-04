import React from 'react';
import { View } from 'react-native';
import { AppText, AppIcon, Badge } from '@esparex/mobile-ui';
import { ListingPrice, ListingLocation } from '../../../domain/Listing';

interface PriceSectionProps {
  title: string;
  price: ListingPrice;
  location?: ListingLocation;
  condition?: 'power_on' | 'power_off';
  category?: string;
}

export const PriceSection = ({
  title,
  price,
  location,
  condition,
  category,
}: PriceSectionProps) => {
  const locationText =
    location?.display || [location?.city, location?.state].filter(Boolean).join(', ');

  return (
    <View className="px-4 py-4 bg-card border-b border-border">
      <AppText variant="h2" weight="bold" className="mb-1.5">
        {price.formatted}
      </AppText>
      <AppText variant="body" color="muted" className="font-medium mb-3">
        {title}
      </AppText>

      {/* Meta row: Location, Condition, Category */}
      <View className="flex-row flex-wrap items-center gap-2">
        {locationText ? (
          <View className="flex-row items-center mr-1">
            <View className="mr-1">
              <AppIcon name="MapPin" size={13} color="#64748b" />
            </View>
            <AppText variant="caption" color="muted" className="font-medium">
              {locationText}
            </AppText>
          </View>
        ) : null}

        {condition ? (
          <Badge
            variant={condition === 'power_on' ? 'success' : 'warning'}
            label={condition === 'power_on' ? 'Working (Powers On)' : 'For Parts / Power Off'}
            size="sm"
          />
        ) : null}

        {category ? (
          <Badge
            variant="default"
            label={category}
            size="sm"
          />
        ) : null}
      </View>
    </View>
  );
};

