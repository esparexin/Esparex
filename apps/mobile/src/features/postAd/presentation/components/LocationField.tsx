import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { LocationMeta } from '@esparex/contracts';
import { base } from '@esparex/design-tokens';

interface LocationFieldProps {
  location?: LocationMeta | null;
  locationDisplay?: string;
  onPressSelect: () => void;
  onAutoDetect?: () => void;
  isDetecting?: boolean;
}

export const LocationField = ({
  location,
  locationDisplay,
  onPressSelect,
  onAutoDetect,
  isDetecting = false,
}: LocationFieldProps) => {
  const displayLabel =
    location?.display ||
    [location?.city, location?.state].filter(Boolean).join(', ') ||
    locationDisplay ||
    'Select Location';

  return (
    <View className="mb-4">
      <AppText variant="caption" className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
        Location <AppText className="text-red-500">*</AppText>
      </AppText>

      <View className="flex-row items-center gap-2">
        {/* Main Location Button */}
        <TouchableOpacity
          onPress={onPressSelect}
          activeOpacity={0.7}
          className="flex-1 flex-row items-center px-3.5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          accessibilityRole="button"
          accessibilityLabel={`Location: ${displayLabel}`}
        >
          <AppIcon name="MapPin" size={16} color={base.brand[600]} />
          <AppText
            variant="body"
            className={`flex-1 ml-2 text-sm ${
              displayLabel === 'Select Location'
                ? 'text-slate-400'
                : 'text-slate-900 dark:text-slate-100 font-medium'
            }`}
            numberOfLines={1}
          >
            {displayLabel}
          </AppText>
          <AppIcon name="ChevronDown" size={14} color={base.slate[400]} />
        </TouchableOpacity>

        {/* Auto-Detect Button */}
        {onAutoDetect && (
          <TouchableOpacity
            onPress={onAutoDetect}
            disabled={isDetecting}
            activeOpacity={0.7}
            className="px-3.5 py-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 flex-row items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Auto-detect location"
          >
            {isDetecting ? (
              <ActivityIndicator size="small" color={base.brand[500]} />
            ) : (
              <>
                <AppIcon name="Compass" size={16} color={base.brand[500]} />
                <AppText variant="caption" className="ml-1.5 text-sky-700 dark:text-sky-300 font-semibold text-xs">
                  Auto-Detect
                </AppText>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
