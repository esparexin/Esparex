"use client";

import type { AdminTabItem } from "./AdminModuleTabs";

export const administrationTabs: AdminTabItem[] = [
    { label: "Admin Users", href: "/admin-users" },
    { label: "Permissions", href: "/admin-users?view=permissions" },
    { label: "Sessions", href: "/admin-sessions" },
    { label: "Audit Logs", href: "/audit-logs" },
    { label: "API Keys", href: "/api-keys" },
];

// Location management pages: /locations, /locations/analytics
export const locationsTabs: AdminTabItem[] = [
    { label: "Locations", href: "/locations" },
    { label: "Geo Analytics", href: "/locations/analytics" },
];

// Finance pages: /plans, /invoices, /finance, /revenue
export const financeTabs: AdminTabItem[] = [
    { label: "Plans", href: "/plans" },
    { label: "Invoices", href: "/invoices" },
    { label: "Transactions", href: "/finance" },
    { label: "Revenue", href: "/revenue" },
];

export const catalogManagementTabs: AdminTabItem[] = [
    { label: "Device Categories", href: "/categories" },
    { label: "Brands",            href: "/brands" },
    { label: "Models",            href: "/models" },
    { label: "Screen Sizes",      href: "/screen-sizes" },
    { label: "Service Types",     href: "/service-types" },
    { label: "Hierarchy",         href: "/taxonomy" },
];

export const sparePartsMasterTabs: AdminTabItem[] = [
    { label: "Spare Parts",  href: "/spare-parts-catalog" },
    { label: "Hierarchy", href: "/taxonomy" },
];

export const moderationTabs: AdminTabItem[] = [
    { label: "Ads", href: "/ads?status=pending", matchPathOnly: true },
    { label: "Services", href: "/services?status=pending", matchPathOnly: true },
    { label: "Spare Parts", href: "/spare-parts?status=pending", matchPathOnly: true },
];

export const serviceLifecycleTabs: AdminTabItem[] = [
    { label: "Pending",     href: "/services?status=pending" },
    { label: "Live",        href: "/services?status=live" },
    { label: "Rejected",    href: "/services?status=rejected" },
    { label: "Expired",     href: "/services?status=expired" },
    { label: "Deactivated", href: "/services?status=deactivated" },
    { label: "All",         href: "/services?status=all" },
];

export const partLifecycleTabs: AdminTabItem[] = [
    { label: 'Pending',     href: '/spare-parts?status=pending' },
    { label: 'Live',        href: '/spare-parts?status=live' },
    { label: 'Rejected',    href: '/spare-parts?status=rejected' },
    { label: 'Sold',        href: '/spare-parts?status=sold' },
    { label: 'Expired',     href: '/spare-parts?status=expired' },
    { label: 'Deactivated', href: '/spare-parts?status=deactivated' },
    { label: 'All',         href: '/spare-parts?status=all' },
];


export const adLifecycleTabs: AdminTabItem[] = [
    { label: "Pending", href: "/ads?status=pending" },
    { label: "Live", href: "/ads?status=live" },
    { label: "Rejected", href: "/ads?status=rejected" },
    { label: "Sold", href: "/ads?status=sold" },
    { label: "Expired", href: "/ads?status=expired" },
    { label: "Deactivated", href: "/ads?status=deactivated" },
    { label: "All", href: "/ads?status=all" },
];


export const notificationsTabs: AdminTabItem[] = [
    { label: "Broadcasts", href: "/notifications" },
    { label: "Smart Alerts", href: "/smart-alerts" },
];
