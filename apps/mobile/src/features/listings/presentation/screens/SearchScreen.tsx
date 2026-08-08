import React, { useCallback } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Screen, Container, AppText, Center, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useSearch } from '../hooks/useSearch';
import { SearchBar } from '../components/SearchBar';
import { ListingCard } from '../components/ListingCard';
import { ListingSkeleton } from '../components/ListingSkeleton';
import { EmptyState } from '../../../common/components/EmptyState';
import { ErrorState } from '../../../common/components/ErrorState';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { Listing } from '../../domain/Listing';

export const SearchScreen = () => {
  const {
    query,
    debouncedQuery,
    handleQueryChange,
    handleSubmit,
    handleClear,
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

  const renderItem = useCallback(
    ({ item }: { item: Listing }) => <ListingCard listing={item} onPress={handlePress} />,
    [handlePress],
  );

  const keyExtractor = useCallback((item: Listing) => item.id, []);


  const listings = data?.pages.flat() ?? [];
  const hasSearched = debouncedQuery.length > 0;

  const renderContent = () => {
    if (!hasSearched) {
      return (
        <Center className="flex-1 px-8">
          <AppIcon name="Search" size={48} color={base.slate[400]} />
          <AppText variant="h4" className="text-slate-500 dark:text-slate-400 mt-4 text-center">
            Search for listings
          </AppText>
          <AppText variant="body" className="text-slate-400 dark:text-slate-500 mt-2 text-center">
            Type a keyword in the search bar above to start searching.
          </AppText>
        </Center>
      );
    }

    if (isError) {
      return <ErrorState onRetry={refetch} />;
    }

    if (isLoading && listings.length === 0) {
      return (
        <View className="px-4 py-2">
          {[1, 2, 3].map((key) => (
            <ListingSkeleton key={key} />
          ))}
        </View>
      );
    }

    return (
      <FlatList
        data={listings}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        windowSize={5}
        maxToRenderPerBatch={5}
        initialNumToRender={5}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            title="No Listings Found"
            description={`No items match your search for "${debouncedQuery}".`}
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
      <Container className="flex-1">
        <SearchBar
          value={query}
          onChangeText={handleQueryChange}
          onSubmit={handleSubmit}
          onClear={handleClear}
          placeholder="Search for parts, models, or brands…"
        />
        {renderContent()}
      </Container>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 100 },
});

