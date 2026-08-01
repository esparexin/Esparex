import React from 'react';
import { View } from 'react-native';
import { AppText, Avatar } from '@esparex/mobile-ui';
import { SellerSummary } from '../../../domain/Listing';

interface SellerSectionProps {
  seller: SellerSummary;
}

export const SellerSection = ({ seller }: SellerSectionProps) => {
  return (
    <View className="px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row items-center">
      <Avatar
        src={seller.avatarUrl}
        fallback={seller.name.substring(0, 2).toUpperCase()}
        size="md"
        className="mr-3"
      />
      <View className="flex-1">
        <AppText variant="h4" className="text-slate-900 dark:text-white font-semibold">
          {seller.name}
        </AppText>
        <AppText variant="caption" className="text-slate-500 dark:text-slate-400">
          {seller.type === 'business' ? 'Business Seller' : 'Private Seller'}
          {seller.isVerified ? ' • Verified' : ''}
        </AppText>
      </View>
    </View>
  );
};
