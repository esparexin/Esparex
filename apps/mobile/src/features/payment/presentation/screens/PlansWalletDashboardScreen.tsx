import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { usePlansWalletDashboard } from '../hooks/usePlansWalletDashboard';
import { styles } from './PlansWalletDashboardScreen.styles';

export const PlansWalletDashboardScreen: React.FC = () => {
  const { dashboardData, isLoading, isError, refetch, isRefetching } = usePlansWalletDashboard();

  if (isLoading && !isRefetching) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading Plans & Wallet...</Text>
      </View>
    );
  }

  const sub = dashboardData?.subscription;
  const wallet = dashboardData?.wallet;
  const creditPacks = dashboardData?.creditPacks || [];
  const promotions = dashboardData?.activePromotions || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
    >
      {/* SECTION 1: Active Subscription Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>SUBSCRIPTION STATUS</Text>
        {sub ? (
          <View style={styles.subDetailContainer}>
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{sub.category} TIER</Text>
              </View>
              <View style={[styles.statusBadge, sub.status === 'EXPIRED' && styles.expiredBadge]}>
                <Text style={styles.statusBadgeText}>{sub.status}</Text>
              </View>
            </View>
            <Text style={styles.planTitle}>{sub.planName}</Text>
            {sub.daysRemaining !== null && (
              <Text style={styles.daysText}>{sub.daysRemaining} days remaining</Text>
            )}
          </View>
        ) : (
          <View style={styles.emptySubContainer}>
            <Text style={styles.emptyTitle}>Free Tier Account</Text>
            <Text style={styles.emptySubtext}>Upgrade to Pro or Business to post unlimited listings and boost sales.</Text>
          </View>
        )}
      </View>

      {/* SECTION 2: Wallet Balances 4-Tile Grid */}
      {wallet && (
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>CREDIT & BENEFIT BALANCES</Text>
          <View style={styles.tileGrid}>
            <View style={styles.tile}>
              <Text style={styles.tileLabel}>Free Ads</Text>
              <Text style={styles.tileValue}>
                {wallet.monthlyFreeAdsRemaining}/{wallet.monthlyFreeAdsTotal}
              </Text>
              <Text style={styles.tileSub}>Monthly free allowance</Text>
            </View>

            <View style={styles.tile}>
              <Text style={styles.tileLabel}>Paid Credits</Text>
              <Text style={[styles.tileValue, { color: '#0066CC' }]}>{wallet.paidAdCredits}</Text>
              <Text style={styles.tileSub}>Never expire</Text>
            </View>

            <View style={styles.tile}>
              <Text style={styles.tileLabel}>Spotlight</Text>
              <Text style={[styles.tileValue, { color: '#F59E0B' }]}>{wallet.spotlightCredits}</Text>
              <Text style={styles.tileSub}>Top homepage placement</Text>
            </View>

            <View style={styles.tile}>
              <Text style={styles.tileLabel}>Top Bumps</Text>
              <Text style={[styles.tileValue, { color: '#3B82F6' }]}>{wallet.topAdCredits}</Text>
              <Text style={styles.tileSub}>Instant search refresh</Text>
            </View>
          </View>
        </View>
      )}

      {/* SECTION 3: Itemized Credit Packs */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>ITEMIZED CREDIT PACKS ({creditPacks.length})</Text>
        {creditPacks.length === 0 ? (
          <Text style={styles.emptySubtext}>No active credit packs found.</Text>
        ) : (
          creditPacks.map((pack) => (
            <View key={pack.packId} style={styles.itemRow}>
              <View>
                <Text style={styles.itemTitle}>{pack.entitlementType.replace('_', ' ')}</Text>
                <Text style={styles.itemSub}>
                  Granted: {pack.totalGranted} | Used: {pack.consumed}
                </Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemValue}>{pack.remaining} left</Text>
                <Text style={styles.itemDate}>
                  {pack.expiresAt ? `Expires ${new Date(pack.expiresAt).toLocaleDateString()}` : 'Never expires'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* SECTION 4: Active Listing Promotions */}
      {promotions.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>ACTIVE PROMOTIONS ({promotions.length})</Text>
          {promotions.map((promo) => (
            <View key={promo.promotionId} style={styles.itemRow}>
              <View>
                <Text style={styles.itemTitle}>{promo.entityTitle}</Text>
                <Text style={styles.itemSub}>Type: {promo.type.replace('_', ' ')}</Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={[styles.itemValue, { color: '#10B981' }]}>
                  {promo.daysRemaining} days left
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

