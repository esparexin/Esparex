import React from 'react';
import { Image, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardScreen, Container, Stack, AppText, Spacer, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { navigate } from '../../../navigation/navigationRef';
import { ROUTES } from '../../../navigation/routes';

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onDismiss?: () => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  description,
  children,
  footer,
  onDismiss,
}) => {
  const navigation = useNavigation();
  const parentNav = navigation.getParent();
  const isDark = useColorScheme() === 'dark';
  const canDismiss = navigation.canGoBack() || Boolean(parentNav?.canGoBack());

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    } else if (parentNav?.canGoBack()) {
      parentNav.goBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigate(ROUTES.MAIN_STACK);
    }
  };

  return (
    <KeyboardScreen>
      <Container maxWidth="sm" className="flex-1 py-8 relative">
        {canDismiss && (
          <View className="absolute top-4 left-4 z-10">
            <TouchableOpacity
              onPress={handleDismiss}
              accessibilityRole="button"
              accessibilityLabel="Close and return to marketplace"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
            >
              <AppIcon name="X" size={20} color={isDark ? base.slate[200] : base.slate[600]} />
            </TouchableOpacity>
          </View>
        )}
        <Stack spacing="lg" className="flex-1 justify-center">
          <Stack spacing="xs" className="mb-4 items-center">
            <Image
              source={require('../../../../assets/logo.png')}
              style={{ width: 180, height: 41, marginBottom: 16 }}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="Esparex Logo"
            />
            <AppText variant="h3" className="text-center font-bold text-slate-900 dark:text-slate-100">
              {title}
            </AppText>
            {description && (
              <AppText variant="body" className="text-center text-slate-500 dark:text-slate-400 mt-1">
                {description}
              </AppText>
            )}
          </Stack>
          
          <Stack spacing="md" className="w-full">
            {children}
          </Stack>

          {footer && (
            <>
              <Spacer size={32} />
              <Stack align="center" className="w-full">
                {footer}
              </Stack>
            </>
          )}
        </Stack>
      </Container>
    </KeyboardScreen>
  );
};
