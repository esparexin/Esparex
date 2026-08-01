import React from 'react';
import { View } from 'react-native';
import { Card } from '@esparex/mobile-ui';


// As per user instructions, we use a simple view placeholder if Skeleton isn't available in mobile-ui yet.
export const ListingSkeleton = () => {
  return (
    <View className="mb-4">
      <Card className="overflow-hidden bg-slate-900 border-slate-800">
        <View className="w-full h-48 bg-slate-800 animate-pulse" />
        <View className="p-4">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 mr-4">
              <View className="w-3/4 h-5 bg-slate-800 rounded mb-2 animate-pulse" />
              <View className="w-1/2 h-5 bg-slate-800 rounded animate-pulse" />
            </View>
            <View className="w-16 h-6 bg-slate-800 rounded animate-pulse" />
          </View>
          <View className="w-1/3 h-4 bg-slate-800 rounded mb-4 animate-pulse" />
          <View className="border-t border-slate-800 pt-3 flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View className="w-6 h-6 rounded-full bg-slate-800 mr-2 animate-pulse" />
              <View className="w-20 h-4 bg-slate-800 rounded animate-pulse" />
            </View>
          </View>
        </View>
      </Card>
    </View>
  );
};
