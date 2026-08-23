import React from 'react';
import { View } from 'react-native';
import { AppText, Avatar, Badge } from '@esparex/mobile-ui';
import { SellerSummary } from '../../../domain/Listing';

interface SellerSectionProps {
  seller: SellerSummary;
}

export const SellerSection = ({ seller }: SellerSectionProps) => {
  return (
    <View className="px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1 mr-2">
        <Avatar
          src={seller.avatarUrl}
          fallback={seller.name.substring(0, 2).toUpperCase()}
          size="md"
          className="mr-3"
        />
        <AppText variant="h4" className="text-slate-900 dark:text-white font-semibold flex-1">
          {seller.name}
        </AppText>
      </View>
      {seller.isVerified && (
        <Badge variant="success" label="Verified" size="sm" />
      )}
    </View>
  );
};
