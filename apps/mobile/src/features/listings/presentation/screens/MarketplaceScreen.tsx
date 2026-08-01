import React, { useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { Screen, Container } from '@esparex/mobile-ui';
import { useListings } from '../hooks/useListings';
import { ListingCard } from '../components/ListingCard';
import { ListingSkeleton } from '../components/ListingSkeleton';
import { EmptyState } from '../../../common/components/EmptyState';
import { ErrorState } from '../../../common/components/ErrorState';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { Listing } from '../../domain/Listing';

export const MarketplaceScreen = () => {
  const { 
    data, 
    isLoading, 
    isError, 
    refetch, 
    fetchNextPage, 
    hasNextPage,
    isFetchingNextPage 
  } = useListings();

  const handlePress = useCallback((id: string) => {
    navigate(ROUTES.MAIN_STACK, { 
      screen: ROUTES.LISTING_DETAILS, 
      params: { id } 
    });
  }, []);

  const renderItem = useCallback(({ item }: { item: Listing }) => {
    return <ListingCard listing={item} onPress={handlePress} />;
  }, [handlePress]);

  const keyExtractor = useCallback((item: Listing) => item.id, []);

  // Performance configuration for large lists
  const getItemLayout = useCallback((_: ArrayLike<Listing> | null | undefined, index: number) => ({
    length: 300, // Approximate height of ListingCard
    offset: 300 * index,
    index,
  }), []);

  if (isError) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  // Combine pages from Infinite Query
  const listings = data?.pages.flat() || [];

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Container className="flex-1">
        {isLoading && listings.length === 0 ? (
          <View className="px-4 py-2">
            {[1, 2, 3].map((key) => <ListingSkeleton key={key} />)}
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
                description="Check back later for new items."
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
