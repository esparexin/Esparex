import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Container, AppText, Center, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
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
import { EmptyState } from '../../../common/components/EmptyState';
import { ErrorState } from '../../../common/components/ErrorState';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { Listing } from '../../domain/Listing';

export const SearchScreen = () => {
  const insets = useSafeAreaInsets();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  let authStatus = 'authenticated';
  try {
    const auth = useAuth();
    authStatus = auth.status;
  } catch {
    authStatus = 'authenticated';
  }

  const { data: savedListings } = useSavedListings(authStatus === 'authenticated');
  const toggleSaveMutation = useToggleSaveListing();

  const savedAdIdSet = useMemo(
    () => new Set((savedListings || []).map((s) => s.id)),
    [savedListings],
  );

  const {
    query,
    debouncedQuery,
    filters,
    activeFilterCount,
    hasSearchFilter,
    setFilters,
    handleQueryChange,
    handleSubmit,
    handleClear,
    handleClearFilters,
    handleSelectCategory,
    handleRemoveSort,
    handleRemoveCondition,
    handleRemovePrice,
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearch();

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
        <Center className="flex-1 px-8 py-12">
          <View className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/50 items-center justify-center mb-4">
            <AppIcon name="Search" size={32} color={base.brand[500]} />
          </View>
          <AppText variant="h3" className="text-slate-800 dark:text-slate-100 font-bold text-center">
            Search Esparex
          </AppText>
          <AppText variant="body" className="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm leading-5">
            Search by keyword, select a category above, or apply filters to find parts, phones, and laptops.
          </AppText>
        </Center>
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
            onSubmit={handleSubmit}
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
