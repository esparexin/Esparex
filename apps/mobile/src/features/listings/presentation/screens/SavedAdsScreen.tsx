import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Screen, Container, Card, AppButton } from '@esparex/mobile-ui';
import { useSavedListings } from '../hooks/useSavedListings';
import { useToggleSaveListing } from '../hooks/useToggleSaveListing';
import { ListingCard } from '../components/ListingCard';
import { Listing } from '../../domain/Listing';
import { semantic } from '@esparex/design-tokens';

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
          // eslint-disable-next-line react-native/no-color-literals
          <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
        ) : (
          <FlatList
            data={(listings as Listing[]) || []}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            // eslint-disable-next-line react-native/no-color-literals
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
  screen: { flex: 1, backgroundColor: semantic.light.background }, // formerly #f8fafc
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: semantic.light.card, // formerly #ffffff
    borderBottomWidth: 1,
    borderBottomColor: semantic.light.border, // formerly #e2e8f0
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: semantic.light.foreground }, // formerly #0f172a
  container: { flex: 1, padding: 16 },
  loader: { marginTop: 32 },
  emptyCard: { padding: 24, borderRadius: 16, backgroundColor: semantic.light.card, alignItems: 'center' }, // formerly #ffffff
  emptyTitle: { fontSize: 18, fontWeight: '700', color: semantic.light.foreground, marginBottom: 6 }, // formerly #0f172a
  emptySubtitle: { fontSize: 13, color: semantic.light['muted-foreground'], textAlign: 'center', marginBottom: 16, lineHeight: 18 }, // formerly #64748b
  exploreButton: { backgroundColor: semantic.light.action },
});
