import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import type { IconName } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';

interface CategoryCardProps {
  title: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * CategoryCard — compact 4-column selectable category card primitive.
 */
export const CategoryCard = ({
  title,
  icon,
  selected,
  onPress,
  disabled = false,
}: CategoryCardProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      accessible
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityState={{ selected, disabled }}
      className="w-[23%] mb-3 items-center"
    >
      <View
        className={[
          'w-14 h-14 rounded-2xl items-center justify-center border-2 mb-1.5',
          selected
            ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 shadow-sm shadow-brand-500/20'
            : disabled
            ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-50'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
        ].join(' ')}
      >
        <AppIcon
          name={icon || 'Package'}
          size={20}
          color={selected ? base.brand[600] : base.slate[500]}
        />
      </View>
      <AppText
        variant="caption"
        className={[
          'text-center text-[11px] leading-tight font-medium px-0.5',
          selected ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-slate-700 dark:text-slate-300',
        ].join(' ')}
        numberOfLines={2}
      >
        {title}
      </AppText>
    </TouchableOpacity>
  );
};

