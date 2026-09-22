export interface MobileChromePolicy {
  showMobileBottomNav: boolean;
  showBottomActionsBar: boolean;
  showContextActionBar: boolean;
  showStickySearch: boolean;
  showMobileSearch: boolean;
  showMobileLocation: boolean;
  hasAnyBottomNav: boolean;
}

const DEFAULT_POLICY: MobileChromePolicy = {
  showMobileBottomNav: true,
  showBottomActionsBar: true,
  showContextActionBar: false,
  showStickySearch: false,
  showMobileSearch: true,
  showMobileLocation: true,
  hasAnyBottomNav: true,
};

const STICKY_SEARCH_PREFIXES = ["/search", "/category"];
const LISTING_DETAIL_PREFIXES = ["/ads/", "/services/", "/spare-part-listings/", "/listings/"];

export function isChatRoute(pathname?: string | null): boolean {
  return (
    pathname === "/chat" ||
    Boolean(pathname?.startsWith("/chat/")) ||
    // Embedded chat lives at /account/messages — suppress footer there too
    Boolean(pathname?.startsWith("/account/messages"))
  );
}

export function getMobileChromePolicy(pathname?: string | null): MobileChromePolicy {
  if (!pathname) return DEFAULT_POLICY;

  if (pathname.startsWith("/admin")) {
    return {
      showMobileBottomNav: false,
      showBottomActionsBar: false,
      showContextActionBar: false,
      showStickySearch: false,
      showMobileSearch: false,
      showMobileLocation: false,
      hasAnyBottomNav: false,
    };
  }

  if (isChatRoute(pathname)) {
    return {
      showMobileBottomNav: false,
      showBottomActionsBar: false,
      showContextActionBar: false,
      showStickySearch: false,
      showMobileSearch: false,
      showMobileLocation: false,
      hasAnyBottomNav: false,
    };
  }

  if (LISTING_DETAIL_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return {
      showMobileBottomNav: false,
      showBottomActionsBar: true,
      showContextActionBar: true,
      showStickySearch: false,
      showMobileSearch: true,
      showMobileLocation: true,
      hasAnyBottomNav: true,
    };
  }

  if (
    pathname === "/post-ad" ||
    pathname.startsWith("/edit-ad") ||
    pathname === "/post-service" ||
    pathname.startsWith("/edit-service") ||
    pathname === "/post-spare-part-listing" ||
    pathname.startsWith("/edit-spare-part")
  ) {
    return {
      showMobileBottomNav: false,
      showBottomActionsBar: false,
      showContextActionBar: false,
      showStickySearch: false,
      showMobileSearch: false,
      showMobileLocation: false,
      hasAnyBottomNav: false,
    };
  }

  // Account & profile routes: reclaim vertical space by hiding search bar & location selector across all account management views
  if (pathname === "/account" || pathname.startsWith("/account/")) {
    return {
      showMobileBottomNav: false,
      showBottomActionsBar: false,
      showContextActionBar: false,
      showStickySearch: false,
      showMobileSearch: false,
      showMobileLocation: false,
      hasAnyBottomNav: true, // Account views have MobileAccountBottomNav
    };
  }

  if (STICKY_SEARCH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return {
      showMobileBottomNav: true,
      showBottomActionsBar: true,
      showContextActionBar: false,
      showStickySearch: true,
      showMobileSearch: true,
      showMobileLocation: true,
      hasAnyBottomNav: true,
    };
  }

  return DEFAULT_POLICY;
}
