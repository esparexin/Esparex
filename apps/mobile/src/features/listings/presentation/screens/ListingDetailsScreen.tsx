import React from 'react';
import { View, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AppText, Center } from '@esparex/mobile-ui';
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        <Center className="flex-1">
          <ActivityIndicator size="large" color="#0ea5e9" />
        </Center>
      </SafeAreaView>
    );
  }

  if (error || !listing) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        <Center className="flex-1 px-4">
          <AppText variant="h3" className="text-red-500 mb-2">Error loading listing</AppText>
          <AppText variant="body" className="text-slate-500 text-center">
            {error ? error.message : 'Listing not found'}
          </AppText>
        </Center>
      </SafeAreaView>
    );
  }

  // Map listing images to array of URLs
  const imageUrls = listing.images ? listing.images.map(img => img.url) : [];

  // Map attributes for the AttributesSection
  const attributes: Array<{ label: string; value: string }> = [];
  if (listing.category) {
    attributes.push({ label: 'Category', value: listing.category });
  }
  if (listing.location?.display) {
    attributes.push({ label: 'Location', value: listing.location.display });
  }

  const actions: ActionDef[] = [
    {
      label: 'Message',
      onPress: () => console.log('Message seller'),
      isPrimary: true,
    },
    {
      label: 'Make Offer',
      onPress: () => console.log('Make offer'),
      isPrimary: false,
    },
  ];

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <ImageCarousel images={imageUrls} />
        
        <PriceSection title={listing.title} price={listing.price} />
        
        <SellerSection seller={listing.seller} />
        
        <AttributesSection attributes={attributes} />
        
        <DescriptionSection description={listing.description} />
        
        {/* Bottom buffer so content isn't hidden behind the absolute ActionBar */}
        <View className="h-24" />
      </ScrollView>
      
      <View className="absolute bottom-0 w-full">
        <ActionBar actions={actions} />
      </View>
    </View>
  );
};
