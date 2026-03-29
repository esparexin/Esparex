export interface MobileChromePolicy {
  showMobileBottomNav: boolean;
  showBottomActionsBar: boolean;
  showContextActionBar: boolean;
  showStickySearch: boolean;
}

const DEFAULT_POLICY: MobileChromePolicy = {
  showMobileBottomNav: true,
  showBottomActionsBar: true,
  showContextActionBar: false,
  showStickySearch: false,
};

const STICKY_SEARCH_PREFIXES = ["/search", "/category"];
const LISTING_DETAIL_PREFIXES = ["/ads/", "/services/", "/spare-part-listings/"];

export function isChatRoute(pathname?: string | null): boolean {
  return pathname === "/chat" || Boolean(pathname?.startsWith("/chat/"));
}

export function getMobileChromePolicy(pathname?: string | null): MobileChromePolicy {
  if (!pathname) return DEFAULT_POLICY;

  if (pathname.startsWith("/admin")) {
    return {
      showMobileBottomNav: false,
      showBottomActionsBar: false,
      showContextActionBar: false,
      showStickySearch: false,
    };
  }

  if (isChatRoute(pathname)) {
    return {
      showMobileBottomNav: false,
      showBottomActionsBar: false,
      showContextActionBar: false,
      showStickySearch: false,
    };
  }

  if (LISTING_DETAIL_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return {
      showMobileBottomNav: false,
      showBottomActionsBar: true,
      showContextActionBar: true,
      showStickySearch: false,
    };
  }

  if (
    pathname === "/post-ad" ||
    pathname.startsWith("/edit-ad") ||
    pathname === "/post-service" ||
    pathname.startsWith("/edit-service") ||
    pathname === "/post-spare-part-listing" ||
    pathname.startsWith("/edit-spare-part") ||
    pathname === "/account/business/apply" ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return {
      showMobileBottomNav: false,
      showBottomActionsBar: false,
      showContextActionBar: false,
      showStickySearch: false,
    };
  }

  if (STICKY_SEARCH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return {
      showMobileBottomNav: true,
      showBottomActionsBar: true,
      showContextActionBar: false,
      showStickySearch: true,
    };
  }

  return DEFAULT_POLICY;
}
