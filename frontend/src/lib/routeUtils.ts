import { buildPublicBrowseRoute } from "@/lib/publicBrowseRoutes";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";

export type SellerType = "business" | "individual";

export type AdDetailNavigateFn = (
    page: UserPage,
    adId?: string | number,
    category?: string,
    sellerIdOrBusinessId?: string,
    serviceId?: string,
    sellerId?: string,
    sellerType?: SellerType
) => void;

export type UserPage =
    | "home"
    | "browse"
    | "browse-service-listings"
    | "category"
    | "post-ad"
    | "business-register"  // Business registration page
    | "ad-detail"
    | "login"
    | "my-ads"
    | "saved-ads"
    | "messages"
    | "public-profile"  // Unified public profile page for all users (normal and business)
    | "profile"
    | "profile-settings"
    | "profile-settings-business"
    | "smart-alerts"
    | "service-detail"
    | "my-business"
    | "my-services"  // My services page
    | "spare-parts"  // My spare parts page
    | "business-profile"  // Business profile page
    | "purchases"
    | "edit-ad"  // Edit ad page
    | "edit-service"  // Edit service page
    | "edit-spare-part"  // Edit spare part listing page
    | "edit-business"  // Edit business profile page
    | "ad-submission-success"
    | "post-service"  // Service posting form
    | "faq"  // FAQ / Help Center page
    | "safety-tips"  // Safety Tips page
    | "business-entry" // Canonical business entry point
    | "post-spare-part-listing" // Canonical spare part creation
    | "spare-part-listing" // Canonical spare part gallery view
    | "browse-spare-part-listings" // Public spare parts browse page

    | "notifications" // Notifications page

    // Static Pages
    | "about"
    | "contact"
    | "careers"
    | "press"
    | "partner"
    | "sitemap"
    | "how-it-works"
    | "report-problem"
    | "terms"
    | "privacy"
    | "cookie-policy"
    | "refund-policy"
    | "verification-policy"
    | "post-ad-rules"
    | "restricted-items"
    | "how-to-post-ad"
    | "how-to-create-service"
    | "how-to-sell-parts"
    | "ad-quality-checklist"
    | "pricing-guide"
    | "photo-guidelines"
    | "avoiding-scams"
    | "business-registration-guide"
    | "business-profile-setup"
    | "business-rules"
    | "payments-billing"
    | "payment-methods"
    | "gst-invoice"
    | "spotlight-pricing"
    | "ad-packs"
    | "general-faq"
    | "buyer-faq"
    | "seller-faq"
    | "business-faq"
    | "payments-faq"
    | "security-faq"
    | "account-faq"
    | "find-technicians"
    | "mobile-spare-parts"
    | "laptop-service"
    | "tv-repair"
    | "spare-parts-marketplace"
    | "device-repair-marketplace"
    | "smart-alerts-guide"
    | "plans-payments"
    | "account";  // /account root — protects all /account/* paths

const STATIC_PAGE_ROUTE_MAP: Partial<Record<UserPage, string>> = {
    home: "/",
    browse: buildPublicBrowseRoute({ type: "ad" }),
    "browse-service-listings": buildPublicBrowseRoute({ type: "service" }),
    "browse-spare-part-listings": buildPublicBrowseRoute({ type: "spare_part" }),
    "post-ad": "/post-ad",
    login: "/login",
    // ── /account/* namespace (SSOT for all private account pages) ──
    account: "/account",
    "my-ads": "/account/ads",
    "my-services": "/account/services",
    "spare-parts": "/account/spare-parts",
    "saved-ads": "/account/saved",
    messages: "/chat",
    profile: "/account/profile",
    "profile-settings": "/account/settings",
    "profile-settings-business": "/business/edit",
    "my-business": "/account/business",
    "business-register": "/account/business/apply",
    "business-entry": "/account/business",
    purchases: "/account/purchases",
    notifications: "/notifications",
    "ad-submission-success": "/ad-submission-success",
    "post-spare-part-listing": "/post-spare-part-listing",
    about: "/about",
    faq: "/faq",
    contact: "/contact",
    terms: "/terms",
    privacy: "/privacy",
    "safety-tips": "/safety-tips",
    "how-it-works": "/how-it-works",
    sitemap: "/site-map",
    "plans-payments": "/account/plans",
    "smart-alerts": "/account/alerts",
    careers: "/faq",
    press: "/faq",
    partner: "/faq",
    "report-problem": "/contact",
    "cookie-policy": "/privacy",
    "refund-policy": "/terms",
    "verification-policy": "/faq",
    "post-ad-rules": "/faq",
    "restricted-items": "/faq",
    "how-to-post-ad": "/faq",
    "how-to-create-service": "/faq",
    "how-to-sell-parts": "/faq",
    "ad-quality-checklist": "/faq",
    "pricing-guide": "/faq",
    "photo-guidelines": "/faq",
    "avoiding-scams": "/safety-tips",
    "business-registration-guide": "/faq",
    "business-profile-setup": "/faq",
    "business-rules": "/faq",
    "payments-billing": "/account/plans",
    "payment-methods": "/account/plans",
    "gst-invoice": "/account/plans",
    "spotlight-pricing": "/account/plans",
    "ad-packs": "/account/plans",
    "general-faq": "/faq",
    "buyer-faq": "/faq",
    "seller-faq": "/faq",
    "business-faq": "/faq",
    "payments-faq": "/faq",
    "security-faq": "/faq",
    "account-faq": "/faq",
    "find-technicians": buildPublicBrowseRoute({ type: "service" }),
    "mobile-spare-parts": buildPublicBrowseRoute({ type: "spare_part" }),
    "laptop-service": buildPublicBrowseRoute({ type: "service" }),
    "tv-repair": buildPublicBrowseRoute({ type: "service" }),
    "spare-parts-marketplace": buildPublicBrowseRoute({ type: "spare_part" }),
    "device-repair-marketplace": buildPublicBrowseRoute({ type: "service" }),
    "smart-alerts-guide": "/account/alerts",
};

export const PROTECTED_USER_PAGE_KEYS = [
    "account",               // protects all /account/* paths via startsWith
    "post-ad",
    "profile",
    "profile-settings",
    "profile-settings-business",
    "my-ads",
    "my-services",
    "saved-ads",
    "messages",
    "notifications",
    "purchases",
    "business-register",
    "business-entry",
    "my-business",
    "edit-ad",
    "edit-service",
    "edit-spare-part",
    "post-service",
] as const;

const PROTECTED_PAGE_ROUTE_OVERRIDES: Partial<Record<UserPage, string>> = {
    "edit-ad": "/edit-ad",
    "edit-service": "/edit-service",
    "edit-spare-part": "/edit-spare-part",
};

export const PROTECTED_ROUTE_PREFIXES = Object.freeze(
    Array.from(
        new Set(
            PROTECTED_USER_PAGE_KEYS
                .map((page) => PROTECTED_PAGE_ROUTE_OVERRIDES[page] || STATIC_PAGE_ROUTE_MAP[page] || "")
                .filter((route): route is string => route.length > 0)
                .map((route) => route.split("?")[0] || route)
        )
    )
);

const PROTECTED_USER_PAGE_KEY_SET = new Set<string>(PROTECTED_USER_PAGE_KEYS);
const normalizePathname = (pathname: string): string => pathname.split("?")[0] || pathname;

export const isProtectedPath = (pathname: string): boolean => {
    const normalized = normalizePathname(pathname);
    return PROTECTED_ROUTE_PREFIXES.some((route) => normalized.startsWith(route));
};

export const isProtectedUserPage = (page?: UserPage): boolean => {
    if (!page) return false;
    return PROTECTED_USER_PAGE_KEY_SET.has(page);
};

/**
 * 🗺️ CENTRAL ROUTE MAPPING
 * Maps abstract UserPage keys to physical Next.js routes.
 * Always use this instead of hardcoded strings in navigateTo functions.
 */
export const getPageRoute = (
    page: UserPage,
    params?: {
        adId?: string | number,
        serviceId?: string | number,
        partId?: string | number,
        businessId?: string | number,
        businessSlug?: string,
        category?: string,
        slug?: string
    }
): string => {
    const staticRoute = STATIC_PAGE_ROUTE_MAP[page];
    if (staticRoute) {
        return staticRoute;
    }

    switch (page) {
        case "category": return params?.category ? `/category/${params.category}` : "/search";
        case "ad-detail":
            return buildPublicListingDetailRoute({
                listingType: "ad",
                id: params?.adId,
                slug: params?.slug,
            });
        case "business-profile":
            return params?.businessSlug
                ? `/business/${encodeURIComponent(String(params.businessSlug))}`
                : "/";

        case "public-profile":
            if (params?.businessSlug) {
                return `/business/${encodeURIComponent(String(params.businessSlug))}`;
            }
            return params?.businessId
                ? `/business/${encodeURIComponent(String(params.businessId))}`
                : "/account/business";
        case "edit-ad": return params?.adId ? `/edit-ad/${params.adId}` : "/account/ads";
        case "edit-service":
            return params?.serviceId
                ? `/edit-service/${params.serviceId}`
                : (params?.adId ? `/edit-service/${params.adId}` : "/account/services");
        case "edit-spare-part":
            return params?.partId
                ? `/edit-spare-part/${params.partId}`
                : (params?.adId ? `/edit-spare-part/${params.adId}` : "/account/spare-parts");

        case "post-service":
            return "/post-service";

        case "service-detail":
            return buildPublicListingDetailRoute({
                listingType: "service",
                id: params?.serviceId,
                slug: params?.slug,
            });

        case "spare-part-listing":
            return buildPublicListingDetailRoute({
                listingType: "spare_part",
                id: params?.partId ?? params?.adId,
                slug: params?.slug,
            });

        default:
            throw new Error(`[routeUtils] Unmapped UserPage route key: ${page}`);
    }
};
