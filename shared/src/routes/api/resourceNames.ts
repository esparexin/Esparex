export const API_RESOURCE_NAMES = {
  USERS: "users",
  ADMIN_USERS: "admin-users",
  ADS: "ads",
  REPORTED_ADS: "reported-ads",
  REPORTS: "reports",
  BUSINESSES: "businesses",
  LOCATIONS: "locations",
  CATALOG: "catalog",
  SERVICES: "services",
  SPARE_PARTS: "spare-parts",
  SPARE_PART_LISTINGS: "spare-part-listings",
  PAYMENTS: "payments",
  INVOICES: "invoices",
  NOTIFICATIONS: "notifications",
  CHAT: "chat",
  SMART_ALERTS: "smart-alerts",
  AUTH: "auth",
  AI: "ai",
  CONTACTS: "contacts",
  EDITORIAL: "editorial",
} as const;

export type ApiResourceName =
  (typeof API_RESOURCE_NAMES)[keyof typeof API_RESOURCE_NAMES];
