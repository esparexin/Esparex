import { DefaultTheme, Theme } from '@react-navigation/native';
import { mobileSemanticColors } from '@esparex/design-tokens';

export const appNavigationTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: mobileSemanticColors.light.primary,
    background: mobileSemanticColors.light.background,
    card: mobileSemanticColors.light.card,
    text: mobileSemanticColors.light.foreground,
    border: mobileSemanticColors.light.border,
    notification: mobileSemanticColors.light.destructive,
  },
};
