/**
 * Admin API routes mounted under `/api/v1/admin`.
 * Keep path strings prefix-free (no `/api/v1/admin`).
 */
export const ADMIN_ROUTES = {
  // Auth
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  ME: "/me",
  CSRF_TOKEN: "/csrf-token",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: (token: string) => `/reset-password/${token}`,

  // Dashboard
  STATS: "/stats",
  DASHBOARD_STATS: "/dashboard/stats",
  ANALYTICS: "/analytics",
  REVENUE: {
    SUMMARY: "/analytics/revenue/summary",
    CATEGORIES: "/analytics/revenue/categories",
  },
  ACTIVITY: "/activity",
  AUDIT_LOGS: "/audit-logs",
  SECURITY_AUDIT: "/security/audit",

  // Users
  USERS: "/users",
  USERS_SEARCH: "/users/search",
  USER_BY_ID: (id: string) => `/users/${id}`,
  USER_OVERVIEW: "/user-management/overview",
  USER_STATUS: (id: string) => `/users/${id}/status`,
  USER_VERIFY: (id: string) => `/users/${id}/verify`,
  // Legacy aliases mapped to canonical admin-users surface
  ADMINS: "/admin-users",
  ADMIN_BY_ID: (id: string) => `/admin-users/${id}`,
  ADMIN_USERS: "/admin-users",
  ADMIN_USER_BY_ID: (id: string) => `/admin-users/${id}`,
  ADMIN_USER_DEACTIVATE: (id: string) => `/admin-users/${id}/deactivate`,
  ADMIN_SESSIONS: "/admin-sessions",
  ADMIN_SESSION_REVOKE: (id: string) => `/admin-sessions/${id}/revoke`,

  // Plans
  PLANS: "/plans",
  PLAN_BY_ID: (id: string) => `/plans/${id}`,
  PLAN_TOGGLE: (id: string) => `/plans/${id}/toggle`,

  // Business
  BUSINESS_ACCOUNTS: "/businesses/accounts",
  BUSINESS_OVERVIEW: "/businesses/overview",
  BUSINESS_REQUESTS: "/businesses/requests",
  BUSINESS_REQUEST_BY_ID: (id: string) => `/businesses/requests/${id}`,
  BUSINESS_DETAIL: (id: string) => `/businesses/${id}`,
  BUSINESS_APPROVE: (id: string) => `/businesses/${id}/approve`,
  BUSINESS_REJECT: (id: string) => `/businesses/${id}/reject`,
  BUSINESS_RENEW: (id: string) => `/businesses/requests/${id}/renew`,
  DELETE_BUSINESS: (id: string) => `/businesses/${id}`,
  BUSINESS_UPDATE: (id: string) => `/businesses/${id}`,
  BUSINESS_STATUS: (id: string) => `/businesses/${id}/status`,

  // Ads / Reports
  LISTINGS: "/listings",
  LISTING_BY_ID: (id: string) => `/listings/${id}`,
  LISTING_APPROVE: (id: string) => `/listings/${id}/approve`,
  LISTING_REJECT: (id: string) => `/listings/${id}/reject`,
  LISTING_DEACTIVATE: (id: string) => `/listings/${id}/deactivate`,
  LISTING_EXPIRE: (id: string) => `/listings/${id}/expire`,
  LISTING_EXTEND: (id: string) => `/listings/${id}/extend`,
  LISTING_COUNTS: "/listings/counts",
  LISTING_DELETE: (id: string) => `/listings/${id}`,
  LISTING_REPORT_RESOLVE: (id: string) => `/listings/${id}/report-resolve`,
  // Legacy report aliases mapped to canonical reports surface
  REPORTED_ADS: "/reports",
  REPORTED_AD_DETAIL: (id: string) => `/reports/${id}`,
  REPORTED_AD_RESOLVE: (id: string) => `/reports/${id}/resolve`,
  REPORTS: "/reports",
  REPORT_STATUS: (id: string) => `/reports/${id}/status`,

  // Catalog
  CATEGORIES: "/categories",
  CATEGORY_BY_ID: (id: string) => `/categories/${id}`,
  CATEGORY_SCHEMA: (id: string) => `/categories/${id}/schema`,
  CATEGORY_STATUS: (id: string) => `/categories/${id}/status`,
  CATEGORY_COUNTS: "/categories/counts",
  BRANDS: "/brands",
  BRAND_BY_ID: (id: string) => `/brands/${id}`,
  APPROVE_BRAND: (id: string) => `/brands/${id}/approve`,
  REJECT_BRAND: (id: string) => `/brands/${id}/reject`,
  MODELS: "/models",
  MODEL_BY_ID: (id: string) => `/models/${id}`,
  MODEL_ENSURE: "/models/ensure",
  APPROVE_MODEL: (id: string) => `/models/${id}/approve`,
  REJECT_MODEL: (id: string) => `/models/${id}/reject`,
  SPARE_PARTS: "/spare-parts",
  SPARE_PART_BY_ID: (id: string) => `/spare-parts/${id}`,

  SERVICE_TYPES: "/service-types",
  SERVICE_TYPE_BY_ID: (id: string) => `/service-types/${id}`,
  SERVICE_TYPE_TOGGLE: (id: string) => `/service-types/${id}/toggle-status`,
  SCREEN_SIZES: "/screen-sizes",
  SCREEN_SIZE_BY_ID: (id: string) => `/screen-sizes/${id}`,

  // Finance
  FINANCE_TRANSACTIONS: "/finance/transactions",
  FINANCE_STATS: "/finance/stats",
  TRANSACTIONS: "/finance/transactions",
  TRANSACTION_STATS: "/finance/stats",
  INVOICES: "/invoices",
  INVOICE_BY_ID: (id: string) => `/invoices/${id}`,
  INVOICE_PRINT: (id: string) => `/invoices/${id}/print`,

  // Notifications / AI
  NOTIFICATIONS_SEND: "/notifications/send",
  NOTIFICATIONS_HISTORY: "/notifications/history",
  AI_GENERATE: "/ai/generate",
  API_KEYS: "/api-keys",
  API_KEY_REVOKE: (id: string) => `/api-keys/${id}/revoke`,

  // Locations
  LOCATIONS: "/locations",
  LOCATIONS_STATS: "/locations/stats/refresh",
  LOCATION_ANALYTICS: "/locations/analytics",
  LOCATION_BY_ID: (id: string) => `/locations/${id}`,
  LOCATION_TOGGLE: (id: string) => `/locations/${id}/toggle`,
  LOCATION_STATES_DISTINCT: "/locations/states",
  GEOFENCES: "/geofences",
  GEOFENCE_BY_ID: (id: string) => `/geofences/${id}`,
  LOCATIONS_MODERATION: "/locations/moderation",

  // System
  SYSTEM_HEALTH: "/system/health",
  SYSTEM_SCAN: "/system/scan",
  SYSTEM_FIX: "/system/fix",
  CACHE_HEALTH: "/cache/health",
  SETTINGS: "/settings",
  SYSTEM_CONFIG: "/system/config",
  SYSTEM_CONFIG_RESET: "/system/config/reset",
  SYSTEM_CONFIG_TEST_EMAIL: "/system/config/test-email",
  SUPPORT_CONTACT: "/support/contact",
  SUPPORT_CONTACT_STATUS: (id: string) => `/support/contact/${id}/status`,

  // Other
  IMPORT_BULK: "/import/bulk",

  IMPORT_SEED: "/import/seed-devices",
  SMART_ALERTS: "/smart-alerts",
} as const;

export type AdminRoutePath =
  | typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES]
  | (string & {});
