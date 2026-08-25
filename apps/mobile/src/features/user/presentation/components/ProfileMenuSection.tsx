import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card, AppText, AppIcon } from '@esparex/mobile-ui';
import type { IconName } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';

export interface MenuItem {
  id: string;
  label: string;
  subtitle?: string;
  icon: IconName;
  onPress: () => void;
}

interface ProfileMenuSectionProps {
  title: string;
  items: MenuItem[];
}

export const ProfileMenuSection = ({ title, items }: ProfileMenuSectionProps) => {
  return (
    <View className="mb-4">
      <AppText variant="caption" className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 mb-2">
        {title}
      </AppText>
      <Card className="p-0 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={item.onPress}
            className="flex-row items-center justify-between p-4"
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3">
                <AppIcon name={item.icon} size={18} color={base.brand[600]} />
              </View>
              <View className="flex-1">
                <AppText variant="body" className="font-semibold text-slate-900 dark:text-slate-100">
                  {item.label}
                </AppText>
                {item.subtitle && (
                  <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs">
                    {item.subtitle}
                  </AppText>
                )}
              </View>
            </View>
            <AppIcon name="ChevronRight" size={16} color={base.slate[400]} />
          </TouchableOpacity>
        ))}
      </Card>
    </View>
  );
};
