import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useUnreadNotificationsCount } from '../../../notifications/presentation/hooks/useNotifications';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';

interface MarketplaceHeaderProps {
  selectedLocationDisplay: string;
  onOpenLocationModal: () => void;
  onPressNotifications?: () => void;
}

export const MarketplaceHeader = ({
  selectedLocationDisplay,
  onOpenLocationModal,
  onPressNotifications,
}: MarketplaceHeaderProps) => {
  const unreadCount = useUnreadNotificationsCount();

  const handlePressNotifications = () => {
    if (onPressNotifications) {
      onPressNotifications();
    } else {
      navigate(ROUTES.MAIN_STACK, {
        screen: ROUTES.NOTIFICATIONS,
      });
    }
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-2.5 bg-card border-b border-border">
      <Image
        source={require('../../../../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Esparex Logo"
      />

      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={onOpenLocationModal}
          className="flex-row items-center bg-muted px-2.5 py-1.5 rounded-full border border-border max-w-[140px]"
          accessibilityRole="button"
          accessibilityLabel={`Current location: ${selectedLocationDisplay}. Tap to change location.`}
        >
          <AppIcon name="MapPin" size={13} color={base.brand[500]} />
          <AppText
            variant="caption"
            className="font-semibold text-foreground-secondary ml-1"
            numberOfLines={1}
          >
            {selectedLocationDisplay}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePressNotifications}
          className="w-8 h-8 rounded-full bg-muted items-center justify-center relative border border-border"
          accessibilityRole="button"
          accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppIcon name="Bell" size={15} color={base.slate[700]} />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-destructive rounded-full min-w-[15px] h-3.5 px-0.5 items-center justify-center border border-card">
              <AppText variant="tiny" className="text-destructive-foreground font-bold text-tiny leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </AppText>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  logo: { width: 110, height: 26 },
});
