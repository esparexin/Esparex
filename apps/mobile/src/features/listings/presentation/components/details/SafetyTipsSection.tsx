import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';

interface SafetyTipsSectionProps {
  adId: string;
  onReportPress?: () => void;
}

export const SafetyTipsSection = ({ adId, onReportPress }: SafetyTipsSectionProps) => {
  const formattedId =
    adId && adId.length === 24 ? adId.slice(-8).toUpperCase() : String(adId || '');

  return (
    <View className="px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <View className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 gap-3">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View className="mr-1.5">
              <AppIcon name="ShieldAlert" size={16} color="#d97706" />
            </View>
            <AppText variant="h4" className="text-amber-950 dark:text-amber-200 font-bold text-body">
              Safety First
            </AppText>
          </View>
          {formattedId ? (
            <AppText variant="caption" className="font-mono text-amber-700 dark:text-amber-400 font-semibold">
              #{formattedId}
            </AppText>
          ) : null}
        </View>

        <View className="gap-2">
          <View className="flex-row items-start mb-2">
            <View className="mr-2 mt-0.5">
              <AppIcon name="CheckCircle2" size={14} color="#059669" />
            </View>
            <View className="flex-1">
              <AppText variant="caption" className="text-amber-900 dark:text-amber-100 font-bold">
                Inspect in person
              </AppText>
              <AppText variant="caption" className="text-amber-900/80 dark:text-amber-200/80 font-normal mt-0.5">
                Meet in a public place to check the item status.
              </AppText>
            </View>
          </View>

          <View className="flex-row items-start mb-2">
            <View className="mr-2 mt-0.5">
              <AppIcon name="AlertCircle" size={14} color="#d97706" />
            </View>
            <View className="flex-1">
              <AppText variant="caption" className="text-amber-900 dark:text-amber-100 font-bold">
                No advance payments
              </AppText>
              <AppText variant="caption" className="text-amber-900/80 dark:text-amber-200/80 font-normal mt-0.5">
                Never pay before receiving and verifying the item.
              </AppText>
            </View>
          </View>

          <View className="flex-row items-start">
            <View className="mr-2 mt-0.5">
              <AppIcon name="Info" size={14} color="#2563eb" />
            </View>
            <View className="flex-1">
              <AppText variant="caption" className="text-amber-900 dark:text-amber-100 font-bold">
                Report fraud
              </AppText>
              <AppText variant="caption" className="text-amber-900/80 dark:text-amber-200/80 font-normal mt-0.5">
                Report suspicious activity to our support team.
              </AppText>
            </View>
          </View>
        </View>
      </View>

      {onReportPress && (
        <TouchableOpacity
          onPress={onReportPress}
          activeOpacity={0.7}
          className="mt-3 flex-row items-center justify-center py-2"
          accessibilityRole="button"
          accessibilityLabel="Report this listing"
        >
          <View className="mr-1.5">
            <AppIcon name="AlertTriangle" size={14} color="#94a3b8" />
          </View>
          <AppText variant="caption" color="muted" className="font-semibold">
            Report this listing
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};
