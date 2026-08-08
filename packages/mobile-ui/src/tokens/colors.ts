// Color tokens adapter consuming @esparex/design-tokens SSOT for React Native & NativeWind

import { base, semantic } from '@esparex/design-tokens';

export const colors = {
  transparent: base.transparent,
  current: base.current,
  black: base.black,
  white: base.white,
  brand: base.brand,
  slate: base.slate,
  success: base.success,
  error: base.error,
  warning: base.warning,
  info: base.info,
  action: base.action,
  semantic,
};

export const COLOR_PALETTE = colors;

