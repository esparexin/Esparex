import React, { useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, Linking, Share } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AppText, Center, Screen } from '@esparex/mobile-ui';
import { MainStackParamList, ROUTES } from '../../../../navigation/routes';
import { navigate } from '../../../../navigation/navigationRef';
import { useAuth, AuthStatus } from '../../../../providers/AuthProvider';
import { useListingDetails } from '../hooks/useListingDetails';
import { useToggleSaveListing } from '../hooks/useToggleSaveListing';
import { useSavedListings } from '../hooks/useSavedListings';
import { useProfile } from '../../../user/presentation/hooks/useProfile';
import { ImageCarousel } from '../components/details/ImageCarousel';
import { PriceSection } from '../components/details/PriceSection';
import { SellerSection } from '../components/details/SellerSection';
import { AvailableSparePartsSection } from '../components/details/AvailableSparePartsSection';
import { DescriptionSection } from '../components/details/DescriptionSection';
import { SafetyTipsSection } from '../components/details/SafetyTipsSection';
import { NearbyRepairServicesSection } from '../components/details/NearbyRepairServicesSection';
import { ReportAdModal } from '../components/details/ReportAdModal';
import { ActionBar, ActionDef } from '../components/details/ActionBar';

import { services } from '../../../../bootstrap';

type ListingDetailsRouteProp = RouteProp<MainStackParamList, typeof ROUTES.LISTING_DETAILS>;

export const ListingDetailsScreen = () => {
  const route = useRoute<ListingDetailsRouteProp>();
  const [showReportModal, setShowReportModal] = useState(false);
  let authStatus: AuthStatus = 'authenticated';
  try {
    const auth = useAuth();
    authStatus = auth.status;
  } catch {
    authStatus = 'authenticated';
  }
  const { id } = route.params;

  const { data: listing, isLoading, error } = useListingDetails(id);
  const { mutate: toggleSave } = useToggleSaveListing();
  const { data: savedListings } = useSavedListings(authStatus === 'authenticated');
  const { data: userProfile } = useProfile(authStatus === 'authenticated');

  const isSaved = (savedListings || []).some((item) => String(item.id) === String(id));
  const isOwner =
    authStatus === 'authenticated' &&
    Boolean(userProfile?.id && String(userProfile.id) === String(listing?.seller.id));

  const handleToggleFavorite = useCallback(() => {
    if (authStatus !== 'authenticated') {
      navigate(ROUTES.AUTH_STACK);
      return;
    }
    toggleSave({ adId: id, isSaved });
  }, [authStatus, id, isSaved, toggleSave]);

  const handleShare = useCallback(async () => {
    if (!listing) return;
    try {
      await Share.share({
        title: listing.title,
        message: `Check out ${listing.title} on Esparex: ${listing.price.formatted}`,
      });
    } catch {
      // ignore
    }
  }, [listing]);

  const handleEditPress = useCallback(() => {
    navigate(ROUTES.MAIN_STACK, {
      screen: ROUTES.MAIN_TABS,
      params: {
        screen: ROUTES.PROFILE_TAB,
        params: {
          screen: ROUTES.EDIT_LISTING,
          params: { id },
        },
      },
    });
  }, [id]);

  const handleMessagePress = useCallback(() => {
    if (authStatus !== 'authenticated') {
      navigate(ROUTES.AUTH_STACK);
      return;
    }

    Alert.alert(
      'Contact Seller',
      'Safety Reminder: Never pay in advance or send money online before inspecting items in person.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Chat',
          onPress: async () => {
            try {
              const conversationId = await services.chatService.startChat(id);
              if (conversationId) {
                navigate(ROUTES.MAIN_STACK, {
                  screen: ROUTES.MAIN_TABS,
                  params: {
                    screen: ROUTES.CHAT_TAB,
                    params: {
                      screen: ROUTES.CHAT_THREAD,
                      params: { conversationId },
                    },
                  },
                });
              }
            } catch (err: any) {
              Alert.alert('Unable to start chat', err?.message || 'Please try again later.');
            }
          },
        },
      ]
    );
  }, [authStatus, id]);

  const handleCallPress = useCallback(() => {
    Alert.alert('Call Seller', 'Do you want to make a call to the seller?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => Linking.openURL('tel:1800000000') },
    ]);
  }, []);

  if (isLoading) {
    return (
      <Screen className="flex-1 bg-white dark:bg-slate-950">
        <Center className="flex-1">
          <ActivityIndicator size="large" color="#0ea5e9" />
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

  const actions: ActionDef[] = isOwner
    ? [
        {
          label: 'Edit Listing',
          onPress: handleEditPress,
          isPrimary: true,
          variant: 'primary',
        },
      ]
    : [
        {
          label: 'Call Seller',
          onPress: handleCallPress,
          isPrimary: false,
          variant: 'outline',
        },
        {
          label: 'Chat / Message',
          onPress: handleMessagePress,
          isPrimary: true,
          variant: 'primary',
        },
      ];

  return (
    <Screen className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <ImageCarousel
          images={imageUrls}
          isSaved={isSaved}
          onToggleSave={handleToggleFavorite}
          onShare={handleShare}
        />

        <PriceSection
          title={listing.title}
          price={listing.price}
        />

        <SellerSection seller={listing.seller} />

        {listing.spareParts && listing.spareParts.length > 0 && (
          <AvailableSparePartsSection spareParts={listing.spareParts} />
        )}

        <DescriptionSection description={listing.description} />

        <SafetyTipsSection
          adId={listing.id}
          onReportPress={() => setShowReportModal(true)}
        />

        <NearbyRepairServicesSection
          category={listing.category}
          city={listing.location?.city || listing.location?.display}
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
