import { MOBILE_VISIBILITY, MobileVisibilityValue } from "@esparex/contracts";

export function normalizeMobileVisibility(
  value: unknown,
  fallback: MobileVisibilityValue = MOBILE_VISIBILITY.SHOW
): MobileVisibilityValue {
  if (value === MOBILE_VISIBILITY.SHOW || value === MOBILE_VISIBILITY.HIDE || value === MOBILE_VISIBILITY.ON_REQUEST) {
    return value;
  }

  if (value === "public") return MOBILE_VISIBILITY.SHOW;
  if (value === "private") return MOBILE_VISIBILITY.HIDE;
  if (value === "contacts") return MOBILE_VISIBILITY.ON_REQUEST;

  return fallback;
}
