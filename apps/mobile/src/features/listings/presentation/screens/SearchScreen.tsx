import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Container } from '@esparex/mobile-ui';
import { useSearch } from '../hooks/useSearch';
import { useSavedListings } from '../hooks/useSavedListings';
import { useToggleSaveListing } from '../hooks/useToggleSaveListing';
import { useAuth } from '../../../../providers/AuthProvider';
import { SearchBar } from '../components/SearchBar';
import { CategoryChips } from '../components/CategoryChips';
import { FilterBar } from '../components/FilterBar';
import { FilterModal } from '../components/FilterModal';
import { ListingCard } from '../components/ListingCard';
import { ListingSkeleton } from '../components/ListingSkeleton';
import { RecentSearchesSection } from '../components/RecentSearchesSection';
import { TrendingSearchesSection } from '../components/TrendingSearchesSection';
import { EmptyState } from '../../../common/components/EmptyState';
import { ErrorState } from '../../../common/components/ErrorState';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { Listing } from '../../domain/Listing';

export const SearchScreen = () => {
  const insets = useSafeAreaInsets();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const { status: authStatus } = useAuth();

  const { data: savedListings } = useSavedListings(authStatus === 'authenticated');
  const toggleSaveMutation = useToggleSaveListing();

  const savedAdIdSet = useMemo(
    () => new Set((savedListings || []).map((s) => s.id)),
    [savedListings],
  );

  const {
    query, debouncedQuery, filters, activeFilterCount, hasSearchFilter,
    setFilters, handleQueryChange, handleSubmit, handleClear, handleClearFilters,
    handleSelectCategory, handleRemoveSort, handleRemoveCondition, handleRemovePrice,
    handleRemoveVerifiedOnly, data, isLoading, isError, refetch, fetchNextPage,
    hasNextPage, isFetchingNextPage,
  } = useSearch();

  const [recentSearches, setRecentSearches] = useState<string[]>([
    'iPhone Display',
    'MacBook Battery',
    'Charging IC',
  ]);

  const handleSearchSubmit = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed) {
      setRecentSearches((prev) => [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 6));
    }
    handleSubmit();
  }, [query, handleSubmit]);

  const handleSelectRecentOrTrending = useCallback(
    (term: string) => {
      handleQueryChange(term);
      setRecentSearches((prev) => [term, ...prev.filter((item) => item !== term)].slice(0, 6));
    },
    [handleQueryChange],
  );

  const handleRemoveRecentSearch = useCallback((term: string) => {
    setRecentSearches((prev) => prev.filter((item) => item !== term));
  }, []);

  const handleClearAllRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const handlePress = useCallback((id: string) => {
    navigate(ROUTES.MAIN_STACK, {
      screen: ROUTES.LISTING_DETAILS,
      params: { id },
    });
  }, []);

  const handleToggleSave = useCallback(
    (id: string) => {
      if (authStatus !== 'authenticated') {
        navigate(ROUTES.AUTH_STACK);
        return;
      }
      const isSaved = savedAdIdSet.has(id);
      toggleSaveMutation.mutate({ adId: id, isSaved });
    },
    [authStatus, savedAdIdSet, toggleSaveMutation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Listing }) => (
      <ListingCard
        listing={item}
        onPress={handlePress}
        isSaved={savedAdIdSet.has(item.id)}
        onToggleSave={handleToggleSave}
      />
    ),
    [handlePress, savedAdIdSet, handleToggleSave],
  );

  const keyExtractor = useCallback((item: Listing) => item.id, []);

  const listings = data?.pages.flat() ?? [];

  const renderContent = () => {
    if (!hasSearchFilter) {
      return (
        <View className="flex-1 px-4 py-4">
          <RecentSearchesSection
            recentSearches={recentSearches}
            onSelect={handleSelectRecentOrTrending}
            onRemove={handleRemoveRecentSearch}
            onClearAll={handleClearAllRecentSearches}
          />
          <TrendingSearchesSection onSelect={handleSelectRecentOrTrending} />
        </View>
      );
    }

    if (isError) {
      return <ErrorState onRetry={refetch} />;
    }

    if (isLoading && listings.length === 0) {
      return (
        <View className="px-3 py-2 flex-row flex-wrap justify-between">
          {[1, 2, 3, 4].map((key) => (
            <View key={key} className="w-[48%]">
              <ListingSkeleton key={key} />
            </View>
          ))}
        </View>
      );
    }

    return (
      <FlatList
        data={listings}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', gap: 10 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        windowSize={5}
        maxToRenderPerBatch={6}
        initialNumToRender={6}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            title="No Listings Found"
            description={
              debouncedQuery
                ? `No items match your search for "${debouncedQuery}".`
                : 'No items match the selected filter criteria.'
            }
            icon="Search"
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
    );
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Container padded={false} className="flex-1">
        {/* Search Bar Input */}
        <View className="px-4 pt-2 pb-1 bg-white dark:bg-slate-900">
          <SearchBar
            value={query}
            onChangeText={handleQueryChange}
            onSubmit={handleSearchSubmit}
            onClear={handleClear}
            placeholder="Search parts, models, brands…"
          />
        </View>

        {/* 1-Tap Category Filter Chips */}
        <CategoryChips
          selectedCategoryId={filters.categoryId}
          onSelectCategory={handleSelectCategory}
        />

        {/* Active Filter Bar & Actions */}
        <FilterBar
          filters={filters}
          activeFilterCount={activeFilterCount}
          onOpenFilterModal={() => setIsFilterModalOpen(true)}
          onClearFilters={handleClearFilters}
          onRemoveSort={handleRemoveSort}
          onRemoveCondition={handleRemoveCondition}
          onRemovePrice={handleRemovePrice}
          onRemoveVerifiedOnly={handleRemoveVerifiedOnly}
        />

        {/* Filter Customization Bottom Sheet */}
        <FilterModal
          visible={isFilterModalOpen}
          initialFilters={filters}
          onClose={() => setIsFilterModalOpen(false)}
          onApply={(updated) => setFilters(updated)}
          onReset={handleClearFilters}
        />

        {/* Dynamic Results / Discovery View */}
        {renderContent()}
      </Container>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
  },
});
