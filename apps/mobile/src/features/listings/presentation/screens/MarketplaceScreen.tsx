import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Container, AppText } from '@esparex/mobile-ui';
import { ListingQueryParams } from '@esparex/contracts';
import { useListings } from '../hooks/useListings';
import { ListingCard } from '../components/ListingCard';
import { ListingSkeleton } from '../components/ListingSkeleton';
import { FilterBar } from '../components/FilterBar';
import { FilterModal } from '../components/FilterModal';
import { EmptyState } from '../../../common/components/EmptyState';
import { ErrorState } from '../../../common/components/ErrorState';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { Listing } from '../../domain/Listing';

export const MarketplaceScreen = () => {
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<ListingQueryParams>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListings(filters);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.sortBy) count += 1;
    if (filters.condition) count += 1;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count += 1;
    if (filters.categoryId) count += 1;
    if (filters.locationId) count += 1;
    return count;
  }, [filters]);

  const handleApplyFilters = useCallback((newFilters: ListingQueryParams) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleRemoveSort = useCallback(() => {
    setFilters((prev) => ({ ...prev, sortBy: undefined, page: 1 }));
  }, []);

  const handleRemoveCondition = useCallback(() => {
    setFilters((prev) => ({ ...prev, condition: undefined, page: 1 }));
  }, []);

  const handleRemovePrice = useCallback(() => {
    setFilters((prev) => ({ ...prev, minPrice: undefined, maxPrice: undefined, page: 1 }));
  }, []);

  const handlePress = useCallback((id: string) => {
    navigate(ROUTES.MAIN_STACK, {
      screen: ROUTES.LISTING_DETAILS,
      params: { id },
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Listing }) => <ListingCard listing={item} onPress={handlePress} />,
    [handlePress],
  );

  const keyExtractor = useCallback((item: Listing) => item.id, []);

  const listings = useMemo(() => data?.pages.flat() || [], [data?.pages]);

  if (isError) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Container className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between py-2">
          <AppText variant="h2" className="font-bold text-slate-900 dark:text-slate-100">
            Marketplace
          </AppText>
        </View>

        <FilterBar
          filters={filters}
          activeFilterCount={activeFilterCount}
          onOpenFilterModal={() => setIsFilterModalOpen(true)}
          onClearFilters={handleClearFilters}
          onRemoveCondition={handleRemoveCondition}
          onRemovePrice={handleRemovePrice}
          onRemoveSort={handleRemoveSort}
        />

        {isLoading && listings.length === 0 ? (
          <View className="px-4 py-2">
            {[1, 2, 3].map((key) => (
              <ListingSkeleton key={key} />
            ))}
          </View>
        ) : (
          <FlatList
            data={listings}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 64 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            removeClippedSubviews={false}
            windowSize={11}
            maxToRenderPerBatch={10}
            initialNumToRender={8}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <EmptyState
                title="No Listings Found"
                description={
                  activeFilterCount > 0
                    ? 'No listings match your selected filters. Try resetting filters.'
                    : 'Check back later for new items.'
                }
                icon="Search"
              />
            }
            refreshControl={
              <RefreshControl
                refreshing={isLoading && listings.length > 0}
                onRefresh={refetch}
                tintColor="#0ea5e9"
              />
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="py-4">
                  <ListingSkeleton />
                </View>
              ) : null
            }
          />
        )}

        <FilterModal
          visible={isFilterModalOpen}
          initialFilters={filters}
          onClose={() => setIsFilterModalOpen(false)}
          onApply={handleApplyFilters}
          onReset={handleClearFilters}
        />
      </Container>
    </Screen>
  );
};

