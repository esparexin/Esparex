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
  AUDIT_LOGS: "/security/audit",
  SECURITY_AUDIT: "/security/audit",

  // Users
  USERS: "/users",
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
  BUSINESS_DETAIL: (id: string) => `/businesses/${id}`,
  BUSINESS_APPROVE: (id: string) => `/businesses/${id}/approve`,
  BUSINESS_REJECT: (id: string) => `/businesses/${id}/reject`,
  BUSINESS_RENEW: (id: string) => `/businesses/${id}/renew`,
  BUSINESS_EXPIRE: (id: string) => `/businesses/${id}/expire`,
  BUSINESS_BULK_APPROVE: "/businesses/bulk/approve",
  BUSINESS_BULK_REJECT: "/businesses/bulk/reject",
  BUSINESS_BULK_DEACTIVATE: "/businesses/bulk/deactivate",
  BUSINESS_BULK_EXPIRE: "/businesses/bulk/expire",
  BUSINESS_BULK_RENEW: "/businesses/bulk/renew",
  BUSINESS_BULK_RESEND_WARNINGS: "/businesses/bulk/resend-warnings",
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
  LISTING_BULK_APPROVE: "/listings/bulk/approve",
  LISTING_BULK_REJECT: "/listings/bulk/reject",
  LISTING_BULK_DEACTIVATE: "/listings/bulk/deactivate",
  LISTING_BULK_EXPIRE: "/listings/bulk/expire",
  LISTING_BULK_EXTEND: "/listings/bulk/extend",
  LISTING_BULK_RESEND_WARNINGS: "/listings/bulk/resend-warnings",
  LISTING_BULK_RESEND_SPOTLIGHT_WARNINGS: "/listings/bulk/resend-spotlight-warnings",
  LISTING_DELETE: (id: string) => `/listings/${id}`,
  LISTING_REPORT_RESOLVE: (id: string) => `/listings/${id}/report-resolve`,
  // Legacy report aliases mapped to canonical reports surface
  REPORTED_ADS: "/reports",
  REPORTED_AD_DETAIL: (id: string) => `/reports/${id}`,
  REPORTED_AD_RESOLVE: (id: string) => `/reports/${id}/resolve`,
  REPORTS: "/reports",
  REPORT_STATUS: (id: string) => `/reports/${id}/status`,

  // Catalog
  CATEGORIES: "/catalog/categories",
  CATEGORY_BY_ID: (id: string) => `/catalog/categories/${id}`,
  CATEGORY_SCHEMA: (id: string) => `/catalog/categories/${id}/schema`,
  CATEGORY_STATUS: (id: string) => `/catalog/categories/${id}/status`,
  CATEGORY_COUNTS: "/catalog/categories/counts",
  BRANDS: "/catalog/brands",
  BRAND_BY_ID: (id: string) => `/catalog/brands/${id}`,
  APPROVE_BRAND: (id: string) => `/catalog/brands/${id}/approve`,
  REJECT_BRAND: (id: string) => `/catalog/brands/${id}/reject`,
  MODELS: "/catalog/models",
  MODEL_BY_ID: (id: string) => `/catalog/models/${id}`,
  MODEL_ENSURE: "/catalog/models/ensure",
  APPROVE_MODEL: (id: string) => `/catalog/models/${id}/approve`,
  REJECT_MODEL: (id: string) => `/catalog/models/${id}/reject`,
  SPARE_PARTS: "/catalog/spare-parts",
  SPARE_PART_BY_ID: (id: string) => `/catalog/spare-parts/${id}`,
  SPARE_PART_TOGGLE: (id: string) => `/catalog/spare-parts/${id}/toggle-status`,

  SERVICE_TYPES: "/catalog/service-types",
  SERVICE_TYPE_BY_ID: (id: string) => `/catalog/service-types/${id}`,
  SERVICE_TYPE_TOGGLE: (id: string) => `/catalog/service-types/${id}/toggle-status`,
  SCREEN_SIZES: "/catalog/screen-sizes",
  SCREEN_SIZE_BY_ID: (id: string) => `/catalog/screen-sizes/${id}`,
  SCREEN_SIZE_TOGGLE: (id: string) => `/catalog/screen-sizes/${id}/toggle-status`,

  // Finance
  FINANCE_TRANSACTIONS: "/finance/transactions",
  FINANCE_STATS: "/finance/stats",
  INVOICES: "/invoices",
  INVOICE_BY_ID: (id: string) => `/invoices/${id}`,
  INVOICE_PRINT: (id: string) => `/invoices/${id}/print`,

  // Notifications / AI
  NOTIFICATIONS_SEND: "/notifications/send",
  NOTIFICATIONS_HISTORY: "/notifications/history",
  NOTIFICATIONS_RECIPIENTS: "/notifications/recipients",
  AI_GENERATE: "/ai/generate",
  API_KEYS: "/api-keys",
  API_KEY_REVOKE: (id: string) => `/api-keys/${id}/revoke`,

  // Locations
  LOCATIONS: "/locations",
  LOCATION_ANALYTICS: "/locations/analytics",
  LOCATION_BY_ID: (id: string) => `/locations/${id}`,
  LOCATION_TOGGLE: (id: string) => `/locations/${id}/toggle`,
  LOCATION_STATES_DISTINCT: "/locations/states",
  GEOFENCES: "/geofences",
  GEOFENCE_BY_ID: (id: string) => `/geofences/${id}`,

  // System
  SYSTEM_HEALTH: "/system/health",
  SYSTEM_SCAN: "/system/scan",
  SYSTEM_FIX: "/system/fix",
  CACHE_HEALTH: "/cache/health",
  SYSTEM_CONFIG: "/system/config",
  SUPPORT_CONTACT: "/support/contact",
  SUPPORT_CONTACT_STATUS: (id: string) => `/support/contact/${id}/status`,

  // Other
  IMPORT_BULK: "/import/bulk",

  IMPORT_SEED: "/import/seed-devices",
  SMART_ALERTS: "/smart-alerts",
  SMART_ALERT_LOGS: "/smart-alerts/logs",
  SMART_ALERT_BULK_RESEND_WARNINGS: "/smart-alerts/bulk/resend-warnings",
} as const;

export type AdminRoutePath =
  | typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES]
  | (string & {});
