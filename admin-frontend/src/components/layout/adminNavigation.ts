"use client";

import type { LucideIcon } from "lucide-react";
import {
    BarChart3,
    Bell,
    Building2,
    Database,
    LayoutDashboard,
    Layers,
    Settings,
    ShieldCheck,
    ShieldAlert,
    Users,
    Wrench,
    Tag,
    List,
    Box
} from "lucide-react";

export type AdminModuleKey =
    | "dashboard"
    | "users"
    | "ads"
    | "services"
    | "parts"
    | "businesses"
    | "businessMaster"
    | "reports"
    | "notifications"
    | "analytics"
    | "administration"
    | "settings"
    | "masterData"
    | "partsCatalog";

export type AdminModuleItem = {
    key: AdminModuleKey;
    label: string;
    icon: LucideIcon;
    href: string;
    roles: string[];
    section?: string;
    counterKey?: "ads" | "reports" | "businesses" | "services";
    aliases?: string[];
};

export const ADMIN_NAV_MODULES: AdminModuleItem[] = [
    {
        key: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        roles: ["all"],
        aliases: ["/code-health", "/plans", "/locations"],
    },
    {
        key: "ads",
        label: "Ads",
        icon: Tag,
        href: "/ads?status=pending&listingType=ad",
        roles: ["admin", "super_admin", "moderator"],
        section: "Inventory",
        counterKey: "ads",
        aliases: ["/ads"],
    },
    {
        key: "services",
        label: "Services",
        icon: List,
        href: "/services?status=pending&listingType=service",
        roles: ["admin", "super_admin", "moderator"],
        section: "Inventory",
        counterKey: "services",
        aliases: ["/services"],
    },
    {
        key: "parts",
        label: "Spare Parts",
        icon: Box,
        href: "/spare-parts?status=pending&listingType=spare_part",
        roles: ["admin", "super_admin", "moderator"],
        section: "Inventory",
        aliases: ["/spare-parts"],
    },
    {
        key: "businesses",
        label: "Business Requests",
        icon: ShieldAlert,
        href: "/business-requests?status=pending",
        roles: ["admin", "super_admin", "moderator"],
        section: "Directory",
        counterKey: "businesses",
        aliases: ["/business-requests"],
    },
    {
        key: "businessMaster",
        label: "Business Master",
        icon: Building2,
        href: "/businesses?status=approved",
        roles: ["admin", "super_admin"],
        section: "Directory",
        aliases: ["/businesses"],
    },
    {
        key: "masterData",
        label: "Device Taxonomy",
        icon: Layers,
        href: "/categories",
        roles: ["admin", "super_admin"],
        section: "Master Data",
        aliases: ["/categories", "/brands", "/models", "/screen-sizes", "/taxonomy", "/service-types"],
    },
    {
        key: "partsCatalog",
        label: "Spare Parts Master",
        icon: Wrench,
        href: "/spare-parts-catalog",
        roles: ["admin", "super_admin"],
        section: "Master Data",
        aliases: ["/spare-parts-catalog"],
    },
    {
        key: "users",
        label: "User Management",
        icon: Users,
        href: "/users",
        roles: ["admin", "super_admin", "moderator"],
        section: "Management",
        aliases: ["/users"],
    },
    {
        key: "analytics",
        label: "Financial Analytics",
        icon: BarChart3,
        section: "Management",
        href: "/finance",
        roles: ["admin", "super_admin"],
        aliases: ["/finance"],
    },
    {
        key: "administration",
        label: "System Administration",
        icon: Settings,
        href: "/admin-users",
        roles: ["super_admin"],
        section: "System",
        aliases: ["/admin-users", "/admin-sessions", "/audit-logs", "/api-keys", "/settings"],
    },
];

export function getAdminModuleByPath(pathname: string): AdminModuleItem | undefined {
    return ADMIN_NAV_MODULES.find((item) =>
        [item.href.split("?")[0], ...(item.aliases || [])].some((candidate) =>
            pathname === candidate || pathname.startsWith(`${candidate}/`)
        )
    );
}
