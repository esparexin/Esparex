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
 * CategoryCard — generic selectable card primitive.
 *
 * Props are intentionally flat primitives (title, icon, selected)
 * rather than a domain object. This makes the component reusable for
 * any selection UI: categories, brands, models, conditions, vehicle
 * types, etc. — without modification.
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
      className="w-[48%] mb-3"
    >
      <View
        className={[
          'rounded-xl p-4 items-center border-2',
          selected
            ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500'
            : disabled
            ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-50'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700',
        ].join(' ')}
      >
        {icon && (
          <View
            className={[
              'w-12 h-12 rounded-full items-center justify-center mb-2',
              selected ? 'bg-brand-100 dark:bg-brand-900/60' : 'bg-slate-100 dark:bg-slate-800',
            ].join(' ')}
          >
            <AppIcon
              name={icon}
              size={22}
              color={selected ? base.brand[500] : base.slate[400]}
            />
          </View>
        )}
        <AppText
          variant="caption"
          className={[
            'text-center font-medium',
            selected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300',
          ].join(' ')}
          numberOfLines={2}
        >
          {title}
        </AppText>
      </View>
    </TouchableOpacity>
  );
};

