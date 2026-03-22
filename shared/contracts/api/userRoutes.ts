/**
 * User/Public API routes mounted under `/api/v1`.
 * Keep path strings prefix-free (no `/api/v1`).
 */
export const USER_ROUTES = {
  // Root
  HEALTH: "health",
  CSRF_TOKEN: "csrf-token",

  // Auth
  SEND_OTP: "auth/send-otp",
  VERIFY_OTP: "auth/verify-otp",
  CANCEL_OTP: "auth/cancel-otp",
  LOGOUT: "auth/logout",

  // Catalog
  CATEGORIES: "catalog/categories",
  BRANDS_BASE: "catalog/brands",
  MODELS_BASE: "catalog/models",
  SPARE_PARTS_BASE: "catalog/spare-parts",
  SPARE_PARTS: (categoryId: string) => `catalog/spare-parts?categoryId=${categoryId}`,
  SERVICE_TYPES: "catalog/service-types",
  SCREEN_SIZES: "catalog/screen-sizes",
  CATALOG_BRAND_SUGGEST: "catalog/brands/suggest",
  CATALOG_MODEL_SUGGEST: "catalog/models/suggest",

  // Ads
  ADS: "ads",
  ADS_NEARBY: "ads/nearby",
  ADS_SUGGESTIONS: "ads/suggestions",
  MY_ADS: "ads/my-ads",
  MY_ADS_STATS: "ads/my-ads/stats",
  AD_DETAIL: (id: string | number) => `ads/${encodeURIComponent(String(id))}`,
  AD_SIMILAR: (id: string | number) => `ads/${encodeURIComponent(String(id))}/similar`,
  AD_VIEW: (id: string | number) => `ads/${encodeURIComponent(String(id))}/view`,
  AD_SOLD: (id: string | number) => `ads/${encodeURIComponent(String(id))}/sold`,
  AD_REPOST: (id: string | number) => `ads/${encodeURIComponent(String(id))}/repost`,
  AD_PROMOTE: (id: string | number) => `ads/${encodeURIComponent(String(id))}/promote`,
  AD_PHONE: (id: string | number) => `ads/${encodeURIComponent(String(id))}/phone`,
  ADS_UPLOAD_IMAGE: "ads/upload-image",
  ADS_TRENDING: "ads/trending",
  HOME_FEED: "ads/home", // canonical home feed endpoint
  
  // Listings (Unified SSOT)
  LISTINGS: "listings",
  LISTING_DETAIL: (id: string | number) => `listings/${id}`,
  LISTING_EDIT: (id: string | number) => `listings/${id}/edit`,
  LISTING_SOLD: (id: string | number) => `listings/${id}/mark-sold`,
  LISTING_PROMOTE: (id: string | number) => `listings/${id}/promote`,
  LISTING_ANALYTICS: (id: string | number) => `listings/${id}/analytics`,
  LISTING_VIEW: (id: string | number) => `listings/${id}/view`,


  // Locations
  LOCATIONS: "locations",
  LOCATIONS_STATES: "locations/states",
  LOCATIONS_CITIES: "locations/cities",
  LOCATIONS_AREAS: "locations/areas",
  LOCATIONS_POPULAR: "locations/popular",
  LOCATIONS_DEFAULT_CENTER: "locations/default-center",
  LOCATIONS_IP_LOCATE: "locations/ip-locate",
  LOCATIONS_GEOCODE: "locations/geocode",
  LOCATIONS_INGEST: "locations/ingest",
  LOG_LOCATION_EVENT: "locations/log-event",

  // Smart Alerts
  SMART_ALERTS: "smart-alerts",
  SMART_ALERT_DETAIL: (id: string | number) => `smart-alerts/${encodeURIComponent(String(id))}`,
  SMART_ALERTS_SAVED_SEARCHES: "smart-alerts/saved-searches",
  SMART_ALERTS_SAVED_SEARCH_DETAIL: (id: string | number) =>
    `smart-alerts/saved-searches/${encodeURIComponent(String(id))}`,

  // AI
  AI_GENERATE: "ai/generate",

  // Businesses
  BUSINESSES_PUBLIC: "businesses",
  BUSINESSES_UPLOAD: "businesses/upload",
  BUSINESS_ME: "businesses/me",
  BUSINESS_ME_STATS: "businesses/me/stats",
  BUSINESS_DETAIL: (id: string) => `businesses/${id}`,
  BUSINESS_STATS: (id: string) => `businesses/${id}/stats`,
  BUSINESS_SERVICES: (id: string) => `businesses/${id}/services`,
  BUSINESS_ADS: (id: string) => `businesses/${id}/ads`,
  BUSINESS_SPARE_PARTS: (id: string) => `businesses/${id}/spare-parts`,

  // Services
  SERVICES: "services",
  SERVICE_VIEW: (id: string) => `services/${encodeURIComponent(id)}/view`,
  MY_SERVICES: "services/my-services",
  SERVICE_PHONE: (id: string) => `services/${id}/phone`,

  // Spare Part Listings
  SPARE_PART_LISTINGS: "spare-part-listings",
  SPARE_PART_LISTING_DETAIL: (id: string) => `spare-part-listings/${encodeURIComponent(id)}`,
  MY_SPARE_PART_LISTINGS: "spare-part-listings/my-listings",

  // Users
  USERS: "users",
  USERS_ME: "users/me",
  USERS_REPUTATION: (id: string | number) => `users/${encodeURIComponent(String(id))}/reputation`,
  USERS_PROFILE: (id: string | number) => `users/${encodeURIComponent(String(id))}/profile`,
  USERS_BLOCK: (id: string | number) => `users/${encodeURIComponent(String(id))}/block`,
  USERS_UPLOAD: "users/upload",
  USERS_WALLET: "users/me/wallet",
  USERS_POSTING_BALANCE: "users/me/posting-balance",
  USERS_SAVED_ADS: "users/saved-ads",
  USERS_SAVED_AD_DETAIL: (id: string) => `users/saved-ads/${id}`,

  // Payments
  PURCHASE_HISTORY: "payments/history",
  PAYMENT_PLANS: "payments/plans",
  PAYMENT_ORDERS: "payments/orders",
  INVOICE_DETAIL: (id: string) => `payments/invoice/${id}`,

  // Categories
  CATEGORY_DETAIL: (id: string) => `catalog/categories/${id}`,
  CATEGORY_SCHEMA: (id: string) => `catalog/categories/${id}/schema`,

  // Notifications
  NOTIFICATIONS: "notifications",
  NOTIF_MARK_READ: (id: string) => `notifications/${id}/read`,
  NOTIF_MARK_ALL_READ: "notifications/all/read",
  NOTIF_REGISTER: "notifications/register",

  // Chat / Messaging (v2 — polling-based)
  CHAT_START: "chat/start",
  CHAT_LIST: "chat/list",
  CHAT_MESSAGES: (id: string) => `chat/${encodeURIComponent(id)}/messages`,
  CHAT_SEND: "chat/send",
  CHAT_READ: "chat/read",
  CHAT_BLOCK: "chat/block",
  CHAT_REPORT: "chat/report",
  CHAT_HIDE: "chat/hide",
  CHAT_UPLOAD_URL: "chat/upload-url",

  // Reports
  REPORTS: "reports",
} as const;

export const API_ROUTES = {
  USER: USER_ROUTES,
} as const;

export type UserRoutePath = typeof USER_ROUTES[keyof typeof USER_ROUTES] | (string & {});
