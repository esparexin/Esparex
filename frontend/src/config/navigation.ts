import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  User as UserIcon,
  Heart,
  Home,
  Package,
  Search,
  Settings,
  Sparkles,
  Wrench,
  CreditCard,
  CircuitBoard,
} from "lucide-react";
import {
  type UserPage,
} from "@/lib/routeUtils";
import { isProtectedPath, isProtectedUserPage } from "@/config/protectedRoutes";
import type { User as AppUser } from "@/types/User";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { canRegisterBusiness } from "@/guards/businessGuards";

export type NavigationRole = "guest" | "user" | "business";
export type NavigationSurface = "profile-dropdown" | "mobile-drawer" | "mobile-bottom-nav";
export type NavigationSection = "main" | "account";

export interface NavigationItem {
  id: string;
  label: string;
  slug: string;
  icon: LucideIcon;
  roles: NavigationRole[];
  showIn: NavigationSurface[];
  section: NavigationSection;
  page?: UserPage;
  href?: string;
}

interface NavigationContext {
  isLoggedIn: boolean;
  user: AppUser | null;
}

export interface ResolvedNavigationItem extends NavigationItem {
  page?: UserPage;
  href?: string;
}

export type ProfileTabValue =
  | "personal"
  | "myads"
  | "services"
  | "spare-parts"
  | "saved"
  | "business"
  | "plans"
  | "settings"
  | "smartalerts"
  | "purchases";

export const PROFILE_TAB_ITEMS: Array<{
  value: ProfileTabValue;
  label: string;
  icon: LucideIcon;
  /** When true, this tab is only shown to admin-verified business accounts */
  businessOnly?: boolean;
}> = [
    { value: "personal", label: "Account", icon: UserIcon },
    { value: "myads", label: "My Ads", icon: Package },
    { value: "services", label: "My Services", icon: Wrench, businessOnly: true },
    { value: "spare-parts", label: "My Spare Parts", icon: CircuitBoard, businessOnly: true },
    { value: "saved", label: "Saved Ads", icon: Heart },
    { value: "business", label: "Business", icon: Building2 },
    { value: "smartalerts", label: "Smart Alerts", icon: Bell },
    { value: "purchases", label: "My Purchases", icon: Package },
    { value: "plans", label: "Plans", icon: CreditCard },
    { value: "settings", label: "Settings", icon: Settings },
  ];

export const PROFILE_TAB_PAGE_ROUTES: Partial<Record<ProfileTabValue, UserPage>> =
  Object.freeze({
    personal: "profile",
    settings: "profile-settings",
    myads: "my-ads",
    saved: "saved-ads",
    smartalerts: "smart-alerts",
    plans: "plans-payments",
    purchases: "purchases",
    business: "my-business",
  });

const BASE_NAVIGATION: NavigationItem[] = [
  {
    id: "home",
    label: "Home",
    slug: "home",
    icon: Home,
    roles: ["guest", "user", "business"],
    showIn: ["mobile-drawer", "mobile-bottom-nav"],
    section: "main",
    page: "home",
  },
  {
    id: "browse",
    label: "Browse Ads",
    slug: "browse-ads",
    icon: Search,
    roles: ["guest", "user", "business"],
    showIn: ["mobile-drawer"],
    section: "main",
    page: "browse",
  },
  {
    id: "search",
    label: "Search",
    slug: "search",
    icon: Search,
    roles: ["guest", "user", "business"],
    showIn: ["mobile-bottom-nav"],
    section: "main",
    href: "/search",
  },
  {
    id: "browse-services",
    label: "Browse Services",
    slug: "browse-services",
    icon: Wrench,
    roles: ["guest", "user", "business"],
    showIn: ["mobile-drawer"],
    section: "main",
    page: "browse-services",
  },
  {
    id: "profile",
    label: "Profile",
    slug: "profile-settings",
    icon: Settings,
    roles: ["user", "business"],
    showIn: ["profile-dropdown", "mobile-drawer"],
    section: "account",
    page: "profile-settings",
  },
  {
    id: "my-ads",
    label: "My Ads",
    slug: "my-ads",
    icon: Package,
    roles: ["user", "business"],
    showIn: ["profile-dropdown", "mobile-drawer"],
    section: "account",
    page: "my-ads",
  },
  {
    id: "favorites",
    label: "Favorites",
    slug: "saved-ads",
    icon: Heart,
    roles: ["user", "business"],
    showIn: ["profile-dropdown", "mobile-drawer"],
    section: "account",
    page: "saved-ads",
  },
  {
    id: "notifications",
    label: "Notifications",
    slug: "notifications",
    icon: Bell,
    roles: ["user", "business"],
    showIn: ["profile-dropdown", "mobile-drawer", "mobile-bottom-nav"],
    section: "account",
    page: "notifications",
  },
  {
    id: "smart-alerts",
    label: "Smart Alerts",
    slug: "smart-alerts",
    icon: Sparkles,
    roles: ["user", "business"],
    showIn: ["profile-dropdown", "mobile-drawer"],
    section: "account",
    href: "/account/alerts",
  },
  {
    id: "plans",
    label: "Plans & Payments",
    slug: "plans-payments",
    icon: CreditCard,
    roles: ["user", "business"],
    showIn: ["profile-dropdown", "mobile-drawer"],
    section: "account",
    href: "/account/plans",
  },
  {
    id: "business-hub",
    label: "Business",
    slug: "business",
    icon: Building2,
    roles: ["user", "business"],
    showIn: ["profile-dropdown", "mobile-drawer"],
    section: "account",
    page: "business-register",
  },
  {
    id: "bottom-nav-profile",
    label: "Profile",
    slug: "account-profile",
    icon: Settings,
    roles: ["guest", "user", "business"],
    showIn: ["mobile-bottom-nav"],
    section: "account",
    href: "/account/profile",
  },
];

export function getNavigationRole(user: AppUser | null): NavigationRole {
  if (!user) return "guest";
  const businessStatus = normalizeBusinessStatus(user.businessStatus, "pending");
  const isBusiness = businessStatus === "live";
  return isBusiness ? "business" : "user";
}

/**
 * Canonical helper to determine if the current user has an admin-verified business.
 * Use this instead of repeating the same logic inline across components.
 */
export function isBusinessVerified(user: AppUser | null): boolean {
  if (!user) return false;
  const status = normalizeBusinessStatus(user.businessStatus, "pending");
  return status === "live";
}

function resolveBusinessItem(
  item: NavigationItem,
  user: AppUser | null
): ResolvedNavigationItem {
  const status = normalizeBusinessStatus(user?.businessStatus, "pending");
  const hasPendingBusinessApplication =
    status === "pending" && Boolean(user?.businessId);
  if (status === "live") {
    return { ...item, label: "Business Hub", page: "business-entry" };
  }
  if (hasPendingBusinessApplication) {
    return { ...item, label: "Business Hub (Pending)", page: "business-entry" };
  }
  if (user && canRegisterBusiness(user)) {
    return {
      ...item,
      label: status === "rejected" ? "Re-Apply Business" : "Register Business",
      page: "business-register",
    };
  }
  return { ...item, label: "Business Hub", page: "business-entry" };
}

function resolveItem(
  item: NavigationItem,
  context: NavigationContext
): ResolvedNavigationItem {
  if (item.id === "business-hub") {
    return resolveBusinessItem(item, context.user);
  }
  return { ...item };
}

export function getNavigationItems(
  surface: NavigationSurface,
  context: NavigationContext
): ResolvedNavigationItem[] {
  const role = getNavigationRole(context.user);

  return BASE_NAVIGATION.filter(
    (item) => {
      const protectedItem =
        isProtectedUserPage(item.page) ||
        (typeof item.href === "string" && isProtectedPath(item.href));

      return (
        item.showIn.includes(surface) &&
        item.roles.includes(role) &&
        (!protectedItem || context.isLoggedIn) &&
        (context.isLoggedIn || item.roles.includes("guest"))
      );
    }
  ).map((item) => resolveItem(item, context));
}

export function getNavigationSections(items: ResolvedNavigationItem[]) {
  return {
    main: items.filter((item) => item.section === "main"),
    account: items.filter((item) => item.section === "account"),
  };
}
