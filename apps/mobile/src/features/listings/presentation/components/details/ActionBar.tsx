import React from 'react';
import { View } from 'react-native';
import { AppButton } from '@esparex/mobile-ui';

export interface ActionDef {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: string;
  isPrimary?: boolean;
}

interface ActionBarProps {
  actions: ActionDef[];
}

export const ActionBar = ({ actions }: ActionBarProps) => {
  if (!actions || actions.length === 0) return null;

  return (
    <View className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex-row justify-between items-center w-full">
      {actions.map((action, index) => (
        <View key={`${action.label}-${index}`} className="flex-1 px-1">
          <AppButton
            variant={action.variant || (action.isPrimary ? 'primary' : 'secondary')}
            onPress={action.onPress}
            label={action.label}
          />
        </View>
      ))}
    </View>
  );
};
