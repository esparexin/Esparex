import React from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Screen, Container, Card, AppText, AppButton } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useSavedListings } from '../hooks/useSavedListings';
import { useToggleSaveListing } from '../hooks/useToggleSaveListing';
import { ListingCard } from '../components/ListingCard';
import { Listing } from '../../domain/Listing';

interface SavedAdsScreenProps {
  onPressListing?: (listingId: string) => void;
  onExploreListings?: () => void;
}

export function SavedAdsScreen({ onPressListing, onExploreListings }: SavedAdsScreenProps) {
  const { data: listings, isLoading, isRefetching, refetch } = useSavedListings();
  const toggleSaveMutation = useToggleSaveListing();

  const handleToggleFavorite = (adId: string) => {
    toggleSaveMutation.mutate({ adId, isSaved: true });
  };

  const renderItem = ({ item }: { item: Listing }) => (
    <ListingCard
      listing={item}
      onPress={() => onPressListing && onPressListing(item.id)}
    />
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View className="px-4 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <AppText variant="h3" className="font-bold text-slate-900 dark:text-white">
          Saved Ads & Favorites
        </AppText>
      </View>

      <Container className="flex-1 bg-slate-50 dark:bg-slate-950 p-4">
        {isLoading ? (
          <ActivityIndicator size="large" color={base.brand[500]} className="mt-8" />
        ) : (
          <FlatList
            data={(listings as Listing[]) || []}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} colors={[base.brand[500]]} tintColor={base.brand[500]} />}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            windowSize={5}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            ListEmptyComponent={
              <Card className="p-6 rounded-2xl bg-white dark:bg-slate-900 items-center border border-slate-200 dark:border-slate-800">
                <AppText variant="h3" className="font-bold text-slate-900 dark:text-white mb-1.5">
                  No Saved Ads Yet
                </AppText>
                <AppText variant="caption" className="text-slate-500 dark:text-slate-400 text-center mb-4 leading-5">
                  Tap the heart icon on any spare part or vehicle listing to save it here for quick access later.
                </AppText>
                {onExploreListings && (
                  <AppButton
                    label="Explore Marketplace"
                    onPress={onExploreListings}
                    className="bg-brand-600 hover:bg-brand-700"
                  />
                )}
              </Card>
            }
          />
        )}
      </Container>
    </Screen>
  );
}

