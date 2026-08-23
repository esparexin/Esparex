import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { FlatList, RefreshControl, View, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Container, AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { ListingQueryParams } from '@esparex/contracts';
import { useListings } from '../hooks/useListings';
import { ListingCard } from '../components/ListingCard';
import { ListingSkeleton } from '../components/ListingSkeleton';
import { FilterBar } from '../components/FilterBar';
import { FilterModal } from '../components/FilterModal';
import { SearchBar } from '../components/SearchBar';
import { CategoryChips } from '../components/CategoryChips';
import { EmptyState } from '../../../common/components/EmptyState';
import { ErrorState } from '../../../common/components/ErrorState';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { Listing } from '../../domain/Listing';

export const MarketplaceScreen = () => {
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<ListingQueryParams>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced search query updating filters
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchQuery.trim() || undefined,
        page: 1,
      }));
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

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
    setSearchQuery('');
  }, []);

  const handleSelectCategory = useCallback((categoryId?: string) => {
    setFilters((prev) => ({
      ...prev,
      categoryId,
      page: 1,
    }));
  }, []);

  const handleRemoveCategory = useCallback(() => {
    setFilters((prev) => ({ ...prev, categoryId: undefined, page: 1 }));
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
      <Container padded={false} className="flex-1">
        {/* Brand & Location Header */}
        <View className="flex-row items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <Image
            source={require('../../../../../assets/logo.png')}
            style={{ width: 120, height: 28 }}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="Esparex Logo"
          />

          <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            <AppIcon name="MapPin" size={13} color={base.brand[500]} />
            <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 ml-1">
              All India
            </AppText>
          </View>
        </View>

        {/* Quick Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={() => {}}
          onClear={() => setSearchQuery('')}
          placeholder="Search spare parts, laptops, phones…"
        />

        {/* Horizontal Category Quick Filter */}
        <CategoryChips
          selectedCategoryId={filters.categoryId}
          onSelectCategory={handleSelectCategory}
        />

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          activeFilterCount={activeFilterCount}
          onOpenFilterModal={() => setIsFilterModalOpen(true)}
          onClearFilters={handleClearFilters}
          onRemoveCategory={handleRemoveCategory}
          onRemoveCondition={handleRemoveCondition}
          onRemovePrice={handleRemovePrice}
          onRemoveSort={handleRemoveSort}
        />

        {/* Listings Feed */}
        {isLoading && listings.length === 0 ? (
          <View className="px-4 py-3">
            {[1, 2, 3].map((key) => (
              <ListingSkeleton key={key} />
            ))}
          </View>
        ) : (
          <FlatList
            data={listings}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 64 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            removeClippedSubviews={true}
            windowSize={5}
            maxToRenderPerBatch={6}
            initialNumToRender={6}
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
                  activeFilterCount > 0 || searchQuery.length > 0
                    ? 'No listings match your search or filters. Try resetting filters.'
                    : 'Check back later for new items.'
                }
                icon="Search"
              />
            }
            refreshControl={
              <RefreshControl
                refreshing={isLoading && listings.length > 0}
                onRefresh={refetch}
                tintColor={base.brand[500]}
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
