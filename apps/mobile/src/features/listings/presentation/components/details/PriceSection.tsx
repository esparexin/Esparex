import React from 'react';
import { View } from 'react-native';
import { AppText } from '@esparex/mobile-ui';
import { ListingPrice } from '../../../domain/Listing';

interface PriceSectionProps {
  title: string;
  price: ListingPrice;
}

export const PriceSection = ({ title, price }: PriceSectionProps) => {
  return (
    <View className="px-4 py-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <AppText variant="h2" className="text-slate-900 dark:text-white font-bold mb-2">
        {price.formatted}
      </AppText>
      <AppText variant="body" className="text-slate-700 dark:text-slate-300">
        {title}
      </AppText>
    </View>
  );
};
