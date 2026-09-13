import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AppText, Center, Screen } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { MainStackParamList, ROUTES } from '../../../../navigation/routes';
import { useAuth } from '../../../../providers/AuthProvider';
import { useListingDetails } from '../hooks/useListingDetails';
import { useToggleSaveListing } from '../hooks/useToggleSaveListing';
import { useSavedListings } from '../hooks/useSavedListings';
import { useProfile } from '../../../user/presentation/hooks/useProfile';
import { useListingActions } from '../hooks/useListingActions';
import { ImageCarousel } from '../components/details/ImageCarousel';
import { PriceSection } from '../components/details/PriceSection';
import { SellerSection } from '../components/details/SellerSection';
import { ListingContentTabs } from '../components/details/ListingContentTabs';
import { SafetyTipsSection } from '../components/details/SafetyTipsSection';
import { ReportAdModal } from '../components/details/ReportAdModal';
import { ActionBar } from '../components/details/ActionBar';

import { services } from '../../../../bootstrap';

type ListingDetailsRouteProp = RouteProp<MainStackParamList, typeof ROUTES.LISTING_DETAILS>;

export const ListingDetailsScreen = () => {
  const route = useRoute<ListingDetailsRouteProp>();
  const [showReportModal, setShowReportModal] = useState(false);
  const { status: authStatus } = useAuth();
  const { id } = route.params;

  const scrollViewRef = useRef<ScrollView>(null);
  const tabSectionY = useRef<number>(0);

  const handleTabChange = useCallback(() => {
    if (tabSectionY.current > 0) {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, tabSectionY.current - 12),
        animated: true,
      });
    }
  }, []);

  const { data: listing, isLoading, error } = useListingDetails(id);
  const { mutate: toggleSave } = useToggleSaveListing();
  const { data: savedListings } = useSavedListings(authStatus === 'authenticated');
  const { data: userProfile } = useProfile(authStatus === 'authenticated');

  const isSaved = (savedListings || []).some((item) => String(item.id) === String(id));
  const isOwner =
    authStatus === 'authenticated' &&
    Boolean(userProfile?.id && String(userProfile.id) === String(listing?.seller.id));

  // View tracking: increment view count once when viewed by a non-owner
  useEffect(() => {
    if (id && listing && !isOwner) {
      services.listingService.incrementListingView(id).catch(() => {
        // Non-blocking telemetry
      });
    }
  }, [id, isOwner, listing]);

  const {
    handleToggleFavorite,
    handleShare,
    handleReportPress,
    actions,
  } = useListingActions({
    id,
    listing,
    isSaved,
    isOwner,
    authStatus,
    toggleSave,
    onOpenReportModal: () => setShowReportModal(true),
  });

  if (isLoading) {
    return (
      <Screen className="flex-1 bg-white dark:bg-slate-950">
        <Center className="flex-1">
          <ActivityIndicator size="large" color={base.brand[500]} />
        </Center>
      </Screen>
    );
  }

  if (error || !listing) {
    return (
      <Screen className="flex-1 bg-white dark:bg-slate-950">
        <Center className="flex-1 px-4">
          <AppText variant="h3" className="text-red-500 mb-2">
            Error loading listing
          </AppText>
          <AppText variant="body" className="text-slate-500 text-center">
            {error ? error.message : 'Listing not found'}
          </AppText>
        </Center>
      </Screen>
    );
  }

  const imageUrls = listing.images ? listing.images.map((img) => img.url) : [];

  return (
    <Screen className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <ImageCarousel
          images={imageUrls}
          isSaved={isSaved}
          onToggleSave={handleToggleFavorite}
          onShare={handleShare}
        />

        <PriceSection
          title={listing.title}
          price={listing.price}
          location={listing.location}
          condition={listing.condition}
          category={listing.category}
        />

        <View
          onLayout={(e) => {
            tabSectionY.current = e.nativeEvent.layout.y;
          }}
        >
          <ListingContentTabs
            description={listing.description}
            spareParts={listing.spareParts}
            locationId={listing.location?.locationId}
            listingCategoryId={listing.categoryId}
            onTabChange={handleTabChange}
          />
        </View>

        <SellerSection seller={listing.seller} />

        <SafetyTipsSection
          adId={listing.id}
          onReportPress={handleReportPress}
        />

        <View className="h-24" />
      </ScrollView>

      <View className="absolute bottom-0 w-full">
        <ActionBar actions={actions} />
      </View>

      <ReportAdModal
        visible={showReportModal}
        adId={listing.id}
        adTitle={listing.title}
        onClose={() => setShowReportModal(false)}
      />
    </Screen>
  );
};
