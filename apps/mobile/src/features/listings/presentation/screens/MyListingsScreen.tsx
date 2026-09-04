import React, { useState, useCallback } from 'react';
import { FlatList, RefreshControl, View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Screen, Container, AppText, AppIcon, AppButton, Card } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useAuth } from '../../../../providers/AuthProvider';
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

interface MyListingsScreenProps {
  onBack?: () => void;
}

export const MyListingsScreen = ({ onBack }: MyListingsScreenProps = {}) => {
  const { status: authStatus } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyListings(selectedStatus ? { status: selectedStatus } : undefined);

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

  if (authStatus === 'anonymous') {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <View className="flex-row items-center px-4 py-3 bg-card border-b border-border">
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              accessibilityLabel="Back to profile"
              accessibilityRole="button"
              className="mr-3 p-1"
            >
              <AppIcon name="ArrowLeft" size={20} color={base.brand[500]} />
            </TouchableOpacity>
          )}
          <AppText variant="h3" className="font-bold text-foreground">
            My Ads &amp; Listings
          </AppText>
        </View>
        <Container className="flex-1 bg-muted p-4">
          <Card className="p-6 items-center mt-4">
            <View className="w-16 h-16 rounded-full bg-muted items-center justify-center mb-4">
              <AppIcon name="Package" size={28} color={base.slate[400]} />
            </View>
            <AppText variant="h3" className="font-bold text-foreground text-center mb-1">
              Sign in to view your listings
            </AppText>
            <AppText variant="body" className="text-foreground-subtle text-center mb-5">
              Manage your active, pending, sold, and draft ads in one place.
            </AppText>
            <AppButton
              label="Sign In / Register"
              onPress={() => navigate(ROUTES.AUTH_STACK)}
              className="w-full"
              accessibilityLabel="Sign in to view your listings"
            />
          </Card>
        </Container>
      </Screen>
    );
  }

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
      {/* Top Header */}
      <View className="flex-row items-center px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            accessibilityLabel="Back to profile"
            accessibilityRole="button"
            className="mr-3 p-1"
          >
            <AppIcon name="ArrowLeft" size={20} color={base.brand[500]} />
          </TouchableOpacity>
        )}
        <AppText variant="h3" className="font-bold text-slate-900 dark:text-white">
          My Ads & Listings
        </AppText>
      </View>

      <Container padded={false} className="flex-1">
        {/* Status Filter Tabs */}
        <View className="py-2 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {STATUS_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.label}
                onPress={() => setSelectedStatus(tab.value)}
                className={`px-4 py-2 rounded-full border ${
                  selectedStatus === tab.value
                    ? 'bg-brand-600 border-brand-600'
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
            contentContainerStyle={styles.listContent}
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
      </Container>
    </Screen>
  );
};

const styles = StyleSheet.create({
  tabsContent: { gap: 8 },
  listContent: { padding: 16, paddingBottom: 100 },
});

