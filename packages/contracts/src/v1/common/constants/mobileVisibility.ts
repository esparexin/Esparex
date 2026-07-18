export const MOBILE_VISIBILITY = {
  SHOW: "show",
  HIDE: "hide",
  ON_REQUEST: "on-request",
} as const;

export const MOBILE_VISIBILITY_VALUES = Object.values(MOBILE_VISIBILITY);

export type MobileVisibilityValue =
  (typeof MOBILE_VISIBILITY_VALUES)[number];
