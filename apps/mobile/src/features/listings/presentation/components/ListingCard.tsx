import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { AppText, Card, Badge, AppIcon } from '@esparex/mobile-ui';
import { base, semantic } from '@esparex/design-tokens';
import { Listing } from '../../domain/Listing';

interface ListingCardProps {
  listing: Listing;
  onPress: (id: string) => void;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
}

export const ListingCard = React.memo<ListingCardProps>(({ listing, onPress, isSaved = false, onToggleSave }) => {
  const primaryImage = listing.images.find((img) => img.isPrimary)?.url || listing.images[0]?.url;

  return (
    <TouchableOpacity
      onPress={() => onPress(listing.id)}
      activeOpacity={0.7}
      className="flex-1 max-w-[48.5%] mb-3"
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${listing.price.formatted}${listing.location?.display ? `, ${listing.location.display}` : ''}`}
    >
      <Card padded={false} className="overflow-hidden rounded-2xl">
        {/* Media Thumbnail */}
        <View style={styles.thumbnailContainer} className="w-full bg-muted relative overflow-hidden">
          {primaryImage ? (
            <Image
              source={{ uri: primaryImage }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              accessibilityLabel={`Photo of ${listing.title}`}
            />
          ) : (
            <View style={StyleSheet.absoluteFillObject} className="items-center justify-center bg-muted">
              <AppIcon name="Image" size={28} color={base.slate[400]} />
            </View>
          )}

          {listing.isSpotlight ? (
            <View className="absolute top-2 left-2 flex-row items-center bg-warning px-2 py-0.5 rounded-full shadow-sm z-10">
              <AppIcon name="Sparkles" size={10} color={base.white} />
              <AppText variant="tiny" className="text-white font-bold ml-1 uppercase tracking-wider">
                Spotlight
              </AppText>
            </View>
          ) : listing.isFeatured ? (
            <View className="absolute top-2 left-2 z-10">
              <Badge label="Featured" variant="warning" size="sm" />
            </View>
          ) : null}

          {listing.seller.isVerified && (
            <View
              className={`absolute top-2 ${onToggleSave ? 'right-9' : 'right-2'} bg-card/90 rounded-full p-0.5 shadow-sm z-10`}
            >
              <AppIcon name="CheckCircle2" size={14} color={base.success[500]} />
            </View>
          )}

          {onToggleSave && (
            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                onToggleSave(listing.id);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="absolute top-2 right-2 bg-card/90 rounded-full p-1.5 shadow-sm items-center justify-center z-10"
              accessibilityRole="button"
              accessibilityLabel={isSaved ? `Remove ${listing.title} from saved` : `Save ${listing.title}`}
            >
              <AppIcon
                name="Heart"
                size={14}
                color={isSaved ? semantic.light.destructive : base.slate[500]}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Card Body */}
        <View className="p-2.5">
          {/* Price & Condition Row */}
          <View className="flex-row items-center justify-between">
            <AppText variant="body-lg" className="text-success font-bold">
              {listing.price.formatted}
            </AppText>

            {listing.condition && (
              <View
                className={`flex-row items-center px-1.5 py-0.5 rounded border ${
                  listing.condition === 'power_on'
                    ? 'bg-success/10 border-success/30'
                    : 'bg-destructive/10 border-destructive/30'
                }`}
                accessibilityLabel={`Device condition: ${listing.condition === 'power_on' ? 'Power On' : 'Power Off'}`}
              >
                <AppIcon
                  name={listing.condition === 'power_on' ? 'Zap' : 'Power'}
                  size={10}
                  color={listing.condition === 'power_on' ? base.success : base.error}
                />
                <AppText
                  variant="caption"
                  className={`ml-1 text-tiny font-bold uppercase tracking-wider ${
                    listing.condition === 'power_on'
                      ? 'text-success'
                      : 'text-destructive'
                  }`}
                >
                  {listing.condition === 'power_on' ? 'ON' : 'OFF'}
                </AppText>
              </View>
            )}
          </View>

          {/* Title (2 lines) */}
          <AppText
            variant="caption"
            className="text-foreground font-medium mt-1 leading-snug"
            numberOfLines={2}
          >
            {listing.title}
          </AppText>

          {/* Location */}
          {listing.location?.display && (
            <View className="flex-row items-center mt-1.5 pt-1.5 border-t border-border">
              <AppIcon name="MapPin" size={11} color={base.slate[500]} />
              <AppText
                variant="caption"
                className="text-foreground-secondary ml-1 flex-1"
                numberOfLines={1}
              >
                {listing.location.display}
              </AppText>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
});

ListingCard.displayName = 'ListingCard';

/** Shared thumbnail dimensions (audit C2): single owner, also used by ListingSkeleton. */
export const listingThumbnailStyle = { width: '100%', height: 130 } as const;

const styles = StyleSheet.create({
  thumbnailContainer: listingThumbnailStyle,
});
