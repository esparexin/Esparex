export interface MobileChromePolicy {
  showMobileBottomNav: boolean;
  showContextActionBar: boolean;
  showStickySearch: boolean;
}

const DEFAULT_POLICY: MobileChromePolicy = {
  showMobileBottomNav: true,
  showContextActionBar: false,
  showStickySearch: false,
};

const STICKY_SEARCH_PREFIXES = ["/search", "/browse-services", "/category"];

export function getMobileChromePolicy(pathname?: string | null): MobileChromePolicy {
  if (!pathname) return DEFAULT_POLICY;

  if (pathname.startsWith("/admin")) {
    return {
      showMobileBottomNav: false,
      showContextActionBar: false,
      showStickySearch: false,
    };
  }

  if (pathname.startsWith("/ads/")) {
    return {
      showMobileBottomNav: false,
      showContextActionBar: true,
      showStickySearch: false,
    };
  }

  if (
    pathname === "/post-ad" ||
    pathname.startsWith("/edit-ad") ||
    pathname === "/post-service" ||
    pathname === "/account/business/apply" ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return {
      showMobileBottomNav: false,
      showContextActionBar: false,
      showStickySearch: false,
    };
  }

  if (STICKY_SEARCH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return {
      showMobileBottomNav: true,
      showContextActionBar: false,
      showStickySearch: true,
    };
  }

  return DEFAULT_POLICY;
}
