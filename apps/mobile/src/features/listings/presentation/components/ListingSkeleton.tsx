import React from 'react';
import { View } from 'react-native';
import { Card } from '@esparex/mobile-ui';
import { listingThumbnailStyle } from './ListingCard';

export const ListingSkeleton = React.memo(() => {
  return (
    <View className="flex-1 max-w-[48.5%] mb-3">
      <Card padded={false} className="overflow-hidden bg-card border border-border rounded-2xl">
        <View style={listingThumbnailStyle} className="w-full bg-muted animate-pulse" />
        <View className="p-2.5">
          {/* Price skeleton */}
          <View className="w-1/2 h-5 bg-muted rounded mb-1.5 animate-pulse" />
          {/* Title skeleton (2 lines) */}
          <View className="w-full h-3.5 bg-muted rounded mb-1 animate-pulse" />
          <View className="w-3/4 h-3.5 bg-muted rounded mb-2 animate-pulse" />
          {/* Location skeleton */}
          <View className="pt-1.5 border-t border-border">
            <View className="w-2/3 h-3 bg-muted rounded animate-pulse" />
          </View>
        </View>
      </Card>
    </View>
  );
});

ListingSkeleton.displayName = 'ListingSkeleton';

