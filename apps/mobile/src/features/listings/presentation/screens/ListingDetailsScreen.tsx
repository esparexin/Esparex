import React, { useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AppText, Center, Screen } from '@esparex/mobile-ui';
import { MainStackParamList, ROUTES } from '../../../../navigation/routes';
import { useListingDetails } from '../hooks/useListingDetails';
import { ImageCarousel } from '../components/details/ImageCarousel';
import { PriceSection } from '../components/details/PriceSection';
import { SellerSection } from '../components/details/SellerSection';
import { AttributesSection } from '../components/details/AttributesSection';
import { DescriptionSection } from '../components/details/DescriptionSection';
import { ActionBar, ActionDef } from '../components/details/ActionBar';

type ListingDetailsRouteProp = RouteProp<MainStackParamList, typeof ROUTES.LISTING_DETAILS>;

export const ListingDetailsScreen = () => {
  const route = useRoute<ListingDetailsRouteProp>();
  const { id } = route.params;

  const { data: listing, isLoading, error } = useListingDetails(id);

  const handleMessagePress = useCallback(() => {
    Alert.alert(
      'Contact Seller',
      'Safety Reminder: Never pay in advance or send money online before inspecting items in person.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Chat', onPress: () => {} },
      ]
    );
  }, []);

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

  const attributes: Array<{ label: string; value: string }> = [];
  if (listing.category) {
    attributes.push({ label: 'Category', value: listing.category });
  }
  if (listing.location?.display) {
    attributes.push({ label: 'Location', value: listing.location.display });
  }
  if (listing.status) {
    attributes.push({ label: 'Status', value: listing.status.toUpperCase() });
  }

  const actions: ActionDef[] = [
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
        <ImageCarousel images={imageUrls} />

        <PriceSection title={listing.title} price={listing.price} />

        <SellerSection seller={listing.seller} />

        <AttributesSection attributes={attributes} />

        <DescriptionSection description={listing.description} />

        <View className="h-24" />
      </ScrollView>

      <View className="absolute bottom-0 w-full">
        <ActionBar actions={actions} />
      </View>
    </Screen>
  );
};
