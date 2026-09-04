import React from 'react';
import { View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { AppText, AppIcon, Card, Badge } from '@esparex/mobile-ui';
import { Business } from '@esparex/contracts';
import { useNearbyBusinesses } from '../../hooks/useNearbyBusinesses';

interface NearbyRepairServicesSectionProps {
  locationId?: string;
  listingCategoryId?: string;
}

export const NearbyRepairServicesSection: React.FC<NearbyRepairServicesSectionProps> = ({
  locationId,
  listingCategoryId,
}) => {
  const { data: businesses = [], isLoading } = useNearbyBusinesses({ locationId, listingCategoryId, limit: 6 });

  if (isLoading || businesses.length === 0) {
    return null;
  }

  const handleCall = (phone: string) => {
    if (phone) {
      void Linking.openURL(`tel:${phone}`);
    }
  };

  return (
    <View className="px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center">
          <View className="mr-1.5">
            <AppIcon name="Wrench" size={16} color="#0ea5e9" />
          </View>
          <AppText variant="h3" className="text-slate-900 dark:text-white font-semibold">
            Nearby Repair Services
          </AppText>
        </View>
      </View>
      <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mb-3">
        Service centers near this listing that offer relevant repairs & spares.
      </AppText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
        {businesses.map((business: Business) => {
          const businessName = business.name || business.businessName || 'Verified Repair Center';
          const locationDisplay =
            business.location?.display ||
            business.location?.city ||
            business.location?.address ||
            'Local Service Center';
          const distanceLabel =
            typeof business.distanceKm === 'number'
              ? business.distanceKm < 1
                ? `${Math.max(100, Math.round(business.distanceKm * 1000))} m away`
                : `${business.distanceKm.toFixed(1)} km away`
              : null;
          const phone = business.mobile || business.contactNumber;

          return (
            <Card
              key={business.id}
              className="mr-3 w-64 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <View className="flex-row items-start justify-between mb-1.5">
                <View className="flex-1 mr-2">
                  <AppText
                    variant="body"
                    className="font-bold text-slate-900 dark:text-white text-sm"
                    numberOfLines={1}
                  >
                    {businessName}
                  </AppText>
                  <View className="flex-row items-center mt-0.5">
                    <AppIcon name="MapPin" size={11} color="#64748b" />
                    <AppText
                      variant="tiny"
                      className="text-slate-500 dark:text-slate-400 ml-1 flex-1"
                      numberOfLines={1}
                    >
                      {locationDisplay}
                    </AppText>
                  </View>
                </View>
                {business.isVerified && (
                  <Badge variant="success" label="Verified" size="sm" />
                )}
              </View>

              {distanceLabel && (
                <AppText variant="tiny" className="text-sky-600 dark:text-sky-400 font-semibold mb-2">
                  📍 {distanceLabel}
                </AppText>
              )}

              {phone ? (
                <TouchableOpacity
                  onPress={() => handleCall(phone)}
                  className="mt-2 py-1.5 px-3 bg-sky-600 rounded-lg flex-row items-center justify-center self-start"
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${businessName}`}
                >
                  <View className="mr-1">
                    <AppIcon name="Phone" size={12} color="#ffffff" />
                  </View>
                  <AppText variant="tiny" className="text-white font-bold">
                    Call Center
                  </AppText>
                </TouchableOpacity>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
};
