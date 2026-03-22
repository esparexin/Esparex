"use client";

import type { LucideIcon } from "lucide-react";
import {
    BarChart3,
    Bell,
    Building2,
    Database,
    LayoutDashboard,
    Layers,
    MapPin,
    MessageSquare,
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
    | "chatModeration"
    | "analytics"
    | "administration"
    | "settings"
    | "masterData"
    | "partsCatalog"
    | "locations";

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
        aliases: [],
    },
    {
        key: "ads",
        label: "Listings",
        icon: Tag,
        href: "/ads?status=pending",
        roles: ["admin", "super_admin", "moderator"],
        section: "Inventory",
        counterKey: "ads",
        aliases: ["/ads", "/services", "/spare-parts"],
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
        key: "locations",
        label: "Locations",
        icon: MapPin,
        href: "/locations",
        roles: ["admin", "super_admin"],
        section: "Master Data",
        aliases: ["/locations", "/locations/analytics", "/locations/geofences"],
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
        key: "notifications",
        label: "Notifications",
        icon: Bell,
        href: "/notifications",
        roles: ["admin", "super_admin"],
        section: "Management",
        aliases: ["/notifications"],
    },
    {
        key: "chatModeration",
        label: "Chat Moderation",
        icon: MessageSquare,
        href: "/chat",
        roles: ["admin", "super_admin"],
        section: "Management",
        aliases: ["/chat"],
    },
    {
        key: "analytics",
        label: "Plans & Invoices",
        icon: BarChart3,
        section: "Management",
        href: "/plans",
        roles: ["admin", "super_admin"],
        aliases: ["/finance", "/plans", "/invoices", "/revenue"],
    },
    {
        key: "administration",
        label: "System Administration",
        icon: ShieldCheck,
        href: "/admin-users",
        roles: ["super_admin"],
        section: "System",
        aliases: ["/admin-users", "/admin-sessions", "/audit-logs", "/api-keys"],
    },
    {
        key: "settings",
        label: "Settings",
        icon: Settings,
        href: "/settings",
        roles: ["super_admin"],
        section: "System",
        aliases: ["/settings"],
    },
];

export function getAdminModuleByPath(pathname: string): AdminModuleItem | undefined {
    return ADMIN_NAV_MODULES.find((item) =>
        [item.href.split("?")[0], ...(item.aliases || [])].some((candidate) =>
            pathname === candidate || pathname.startsWith(`${candidate}/`)
        )
    );
}
