import React, { useState, useCallback } from 'react';
import { FlatList, RefreshControl, View, TouchableOpacity, ScrollView } from 'react-native';
import { Screen, Container, AppText } from '@esparex/mobile-ui';
import { useMyListings } from '../hooks/useMyListings';
import { ListingCard } from '../components/ListingCard';
import { ListingSkeleton } from '../components/ListingSkeleton';
import { EmptyState } from '../../../common/components/EmptyState';
import { ErrorState } from '../../../common/components/ErrorState';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { Listing } from '../../domain/Listing';

const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: 'Live', value: 'live' },
  { label: 'Pending', value: 'pending' },
  { label: 'Sold', value: 'sold' },
  { label: 'Expired', value: 'expired' },
  { label: 'Draft', value: 'draft' },
];

export const MyListingsScreen = () => {
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyListings(selectedStatus ? { condition: selectedStatus } : undefined);

  const handlePress = useCallback((id: string) => {
    navigate(ROUTES.MAIN_STACK, {
      screen: ROUTES.LISTING_DETAILS,
      params: { id },
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Listing }) => <ListingCard listing={item} onPress={handlePress} />,
    [handlePress]
  );

  const keyExtractor = useCallback((item: Listing) => item.id, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<Listing> | null | undefined, index: number) => ({
      length: 300,
      offset: 300 * index,
      index,
    }),
    []
  );

  if (isError) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const listings = data?.pages.flat() || [];

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Container className="flex-1">
        {/* Status Filter Tabs */}
        <View className="py-2 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {STATUS_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.label}
                onPress={() => setSelectedStatus(tab.value)}
                className={`px-4 py-2 rounded-full border ${
                  selectedStatus === tab.value
                    ? 'bg-sky-500 border-sky-500'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <AppText
                  variant="caption"
                  className={`font-semibold ${
                    selectedStatus === tab.value
                      ? 'text-white'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

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
            getItemLayout={getItemLayout}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            windowSize={5}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
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
                  selectedStatus
                    ? `You have no ${selectedStatus} listings.`
                    : "You haven't created any ads yet."
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
      </Container>
    </Screen>
  );
};
