import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { FlatList, RefreshControl, View, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Container, AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { ListingQueryParams, LocationMeta } from '@esparex/contracts';
import { useListings } from '../hooks/useListings';
import { useSavedListings } from '../hooks/useSavedListings';
import { useToggleSaveListing } from '../hooks/useToggleSaveListing';
import { useAuth } from '../../../../providers/AuthProvider';
import { ListingCard } from '../components/ListingCard';
import { ListingSkeleton } from '../components/ListingSkeleton';
import { MarketplaceHeader } from '../components/MarketplaceHeader';
import { SearchBar } from '../components/SearchBar';
import { CategoryChips } from '../components/CategoryChips';
import { LocationSelectorModal } from '../components/LocationSelectorModal';
import { EmptyState } from '../../../common/components/EmptyState';
import { ErrorState } from '../../../common/components/ErrorState';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { Listing } from '../../domain/Listing';

export const MarketplaceScreen = () => {
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<ListingQueryParams>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLocationDisplay, setSelectedLocationDisplay] = useState('All India');

  const { status: authStatus } = useAuth();

  const { data: savedListings } = useSavedListings(authStatus === 'authenticated');
  const toggleSaveMutation = useToggleSaveListing();

  const savedAdIdSet = useMemo(
    () => new Set((savedListings || []).map((s) => s.id)),
    [savedListings],
  );

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

  const handleSelectCategory = useCallback((categoryId?: string) => {
    setFilters((prev) => ({
      ...prev,
      categoryId,
      page: 1,
    }));
  }, []);

  const handleSelectLocation = useCallback((location: LocationMeta | null) => {
    if (location) {
      const locId = location.locationId || (location as { _id?: string })._id || location.name;
      setFilters((prev) => ({
        ...prev,
        locationId: locId,
        page: 1,
      }));
      setSelectedLocationDisplay(location.display || location.city || location.name || 'Selected Location');
    } else {
      setFilters((prev) => ({
        ...prev,
        locationId: undefined,
        page: 1,
      }));
      setSelectedLocationDisplay('All India');
    }
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
        <MarketplaceHeader
          selectedLocationDisplay={selectedLocationDisplay}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
        />

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

        {/* Listings Feed */}
        {isLoading && listings.length === 0 ? (
          <View className="px-3 py-2 flex-row flex-wrap justify-between">
            {[1, 2, 3, 4].map((key) => (
              <View key={key} className="w-[48%]">
                <ListingSkeleton />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={listings}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', gap: 10 }}
            contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: insets.bottom + 64 }}
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
                  searchQuery.length > 0 || filters.categoryId || filters.locationId
                    ? 'No listings match your search or location. Try selecting another category or location.'
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

        <LocationSelectorModal
          visible={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onSelectLocation={handleSelectLocation}
          selectedLocationId={filters.locationId}
        />
      </Container>
    </Screen>
  );
};
