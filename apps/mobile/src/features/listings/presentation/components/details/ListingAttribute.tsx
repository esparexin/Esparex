import React from 'react';
import { View } from 'react-native';
import { AppText } from '@esparex/mobile-ui';

interface ListingAttributeProps {
  label: string;
  value: string;
}

export const ListingAttribute = ({ label, value }: ListingAttributeProps) => {
  return (
    <View className="flex-row py-2 justify-between items-center border-b border-slate-50 dark:border-slate-800">
      <AppText variant="body" className="text-slate-500 dark:text-slate-400">
        {label}
      </AppText>
      <AppText variant="body" className="text-slate-900 dark:text-white font-medium">
        {value}
      </AppText>
    </View>
  );
};
