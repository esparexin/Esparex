import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Screen, Container, Card, AppButton } from '@esparex/mobile-ui';
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
    <Screen style={styles.screen}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Saved Ads & Favorites</Text>
      </View>

      <Container style={styles.container}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
        ) : (
          <FlatList
            data={(listings as Listing[]) || []}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} colors={['#2563eb']} tintColor="#2563eb" />}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            windowSize={5}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            ListEmptyComponent={
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Saved Ads Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap the heart icon on any spare part or vehicle listing to save it here for quick access later.
                </Text>
                {onExploreListings && (
                  <AppButton
                    label="Explore Marketplace"
                    onPress={onExploreListings}
                    style={styles.exploreButton}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  container: { flex: 1, padding: 16 },
  loader: { marginTop: 32 },
  emptyCard: { padding: 24, borderRadius: 16, backgroundColor: '#ffffff', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  exploreButton: { backgroundColor: '#2563eb' },
});
