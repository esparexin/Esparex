import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { AppText, Card, Badge, AppIcon } from '@esparex/mobile-ui';
import { Listing } from '../../domain/Listing';

interface ListingCardProps {
  listing: Listing;
  onPress: (id: string) => void;
}

export const ListingCard = React.memo<ListingCardProps>(({ listing, onPress }) => {
  const primaryImage = listing.images.find((img) => img.isPrimary)?.url || listing.images[0]?.url;

  return (
    <TouchableOpacity
      onPress={() => onPress(listing.id)}
      activeOpacity={0.7}
      className="mb-4"
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${listing.price.formatted}${listing.location?.display ? `, ${listing.location.display}` : ''}`}
    >
      <Card className="overflow-hidden">
        {primaryImage ? (
          <Image
            source={{ uri: primaryImage }}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            className="w-full h-48 bg-slate-800"
            accessibilityLabel={`Photo of ${listing.title}`}
          />
        ) : (
          <View className="w-full h-48 bg-slate-800 items-center justify-center">
            <AppIcon name="Image" size={48} color="#475569" />
          </View>
        )}

        <View className="p-4">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 mr-4">
              <AppText variant="h3" className="text-slate-100" numberOfLines={2}>
                {listing.title}
              </AppText>
            </View>
            <AppText variant="h2" className="text-sky-400">
              {listing.price.formatted}
            </AppText>
          </View>

          {listing.location?.display && (
            <View className="flex-row items-center mb-3">
              <AppIcon name="MapPin" size={14} color="#64748b" />
              <AppText variant="caption" className="text-slate-400 ml-1">
                {listing.location.display}
              </AppText>
            </View>
          )}

          <View className="flex-row justify-between items-center mt-2 border-t border-slate-800 pt-3">
            <View className="flex-row items-center">
              <View className="w-6 h-6 rounded-full bg-slate-700 mr-2 items-center justify-center">
                <AppIcon
                  name={listing.seller.type === 'business' ? 'Briefcase' : 'User'}
                  size={12}
                  color="#94a3b8"
                />
              </View>
              <AppText variant="caption" className="text-slate-300">
                {listing.seller.name}
              </AppText>
              {listing.seller.isVerified && (
                <View className="ml-1">
                  <AppIcon name="CheckCircle2" size={12} color="#10b981" />
                </View>
              )}
            </View>

            <View className="flex-row gap-2">
              {listing.isFeatured && <Badge label="Featured" variant="warning" />}
              {listing.status !== 'active' && <Badge label={listing.status} variant="error" />}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
});

ListingCard.displayName = 'ListingCard';
