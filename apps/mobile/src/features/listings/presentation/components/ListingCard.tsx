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
      <Card padded={false} className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
        {/* Media Thumbnail */}
        <View style={styles.thumbnailContainer} className="w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
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
            <View style={StyleSheet.absoluteFillObject} className="items-center justify-center bg-slate-100 dark:bg-slate-800">
              <AppIcon name="Image" size={28} color={base.slate[400]} />
            </View>
          )}

          {listing.isSpotlight ? (
            <View className="absolute top-2 left-2 flex-row items-center bg-amber-500 px-2 py-0.5 rounded-full shadow-sm z-10">
              <AppIcon name="Sparkles" size={10} color={base.white} />
              <AppText variant="caption" className="text-white text-tiny font-bold ml-1 uppercase tracking-wider">
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
              className={`absolute top-2 ${onToggleSave ? 'right-9' : 'right-2'} bg-white/90 dark:bg-slate-900/90 rounded-full p-0.5 shadow-sm z-10`}
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
              className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 rounded-full p-1.5 shadow-sm items-center justify-center z-10"
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
            <AppText variant="body" className="text-emerald-600 dark:text-emerald-400 font-bold text-base">
              {listing.price.formatted}
            </AppText>

            {listing.condition && (
              <View
                className={`flex-row items-center px-1.5 py-0.5 rounded border ${
                  listing.condition === 'power_on'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
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
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-700 dark:text-rose-400'
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
            className="text-slate-800 dark:text-slate-100 font-medium mt-1 leading-snug"
            numberOfLines={2}
          >
            {listing.title}
          </AppText>

          {/* Location */}
          {listing.location?.display && (
            <View className="flex-row items-center mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <AppIcon name="MapPin" size={11} color={base.slate[400]} />
              <AppText
                variant="caption"
                className="text-slate-400 dark:text-slate-500 ml-1 text-xs flex-1"
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

const styles = StyleSheet.create({
  thumbnailContainer: {
    width: '100%',
    height: 130,
  },
});
