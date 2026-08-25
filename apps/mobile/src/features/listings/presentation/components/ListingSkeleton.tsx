import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '@esparex/mobile-ui';

export const ListingSkeleton = React.memo(() => {
  return (
    <View className="flex-1 max-w-[48.5%] mb-3">
      <Card padded={false} className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
        <View style={styles.thumbnailSkeleton} className="w-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <View className="p-2.5">
          {/* Price skeleton */}
          <View className="w-1/2 h-5 bg-slate-200 dark:bg-slate-800 rounded mb-1.5 animate-pulse" />
          {/* Title skeleton (2 lines) */}
          <View className="w-full h-3.5 bg-slate-200 dark:bg-slate-800 rounded mb-1 animate-pulse" />
          <View className="w-3/4 h-3.5 bg-slate-200 dark:bg-slate-800 rounded mb-2 animate-pulse" />
          {/* Location skeleton */}
          <View className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <View className="w-2/3 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </View>
        </View>
      </Card>
    </View>
  );
});

ListingSkeleton.displayName = 'ListingSkeleton';

const styles = StyleSheet.create({
  thumbnailSkeleton: {
    width: '100%',
    height: 130,
  },
});

