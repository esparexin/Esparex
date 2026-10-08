import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { base, semantic } from '@esparex/design-tokens';

interface SafetyTipsSectionProps {
  adId: string;
  onReportPress?: () => void;
}

export const SafetyTipsSection = ({ adId, onReportPress }: SafetyTipsSectionProps) => {
  const formattedId =
    adId && adId.length === 24 ? adId.slice(-8).toUpperCase() : String(adId || '');

  return (
    <View className="px-4 py-4 bg-card border-b border-border">
      <View className="rounded-2xl border border-warning/30 bg-warning/10 p-4 gap-3">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View className="mr-1.5">
              <AppIcon name="ShieldAlert" size={16} color={base.warning} />
            </View>
            <AppText variant="body" className="text-foreground font-bold">
              Safety First
            </AppText>
          </View>
          {formattedId ? (
            <AppText variant="caption" className="font-mono text-warning font-semibold">
              {`#${formattedId}`}
            </AppText>
          ) : null}
        </View>

        <View className="gap-2">
          <View className="flex-row items-start mb-2">
            <View className="mr-2 mt-0.5">
              <AppIcon name="CheckCircle2" size={14} color={semantic.light.success} />
            </View>
            <View className="flex-1">
              <AppText variant="caption" className="text-foreground font-bold">
                Inspect in person
              </AppText>
              <AppText variant="caption" className="text-foreground-secondary font-normal mt-0.5">
                Meet in a public place to check the item status.
              </AppText>
            </View>
          </View>

          <View className="flex-row items-start mb-2">
            <View className="mr-2 mt-0.5">
              <AppIcon name="AlertCircle" size={14} color={base.warning} />
            </View>
            <View className="flex-1">
              <AppText variant="caption" className="text-foreground font-bold">
                No advance payments
              </AppText>
              <AppText variant="caption" className="text-foreground-secondary font-normal mt-0.5">
                Never pay before receiving and verifying the item.
              </AppText>
            </View>
          </View>

          <View className="flex-row items-start">
            <View className="mr-2 mt-0.5">
              <AppIcon name="Info" size={14} color={semantic.light.primary} />
            </View>
            <View className="flex-1">
              <AppText variant="caption" className="text-foreground font-bold">
                Report fraud
              </AppText>
              <AppText variant="caption" className="text-foreground-secondary font-normal mt-0.5">
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
          hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
          className="mt-3 flex-row items-center justify-center py-2"
          accessibilityRole="button"
          accessibilityLabel="Report this listing"
        >
          <View className="mr-1.5">
            <AppIcon name="AlertTriangle" size={14} color={base.slate[500]} />
          </View>
          <AppText variant="caption" color="secondary" className="font-semibold">
            Report this listing
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};
