"use client";

import type { LucideIcon } from "lucide-react";
import {
    BarChart3,
    Bell,
    LayoutDashboard,
    Layers,
    MapPin,
    MessageSquare,
    Settings,
    ShieldCheck,
    ShieldAlert,
    Users,
    Tag,
    List,
} from "lucide-react";

export type AdminModuleKey =
    | "dashboard"
    | "users"
    | "ads"
    | "services"
    | "parts"
    | "businessMaster"
    | "reports"
    | "notifications"
    | "chatModeration"
    | "analytics"
    | "administration"
    | "settings"
    | "masterData"
    | "partsCatalog"
    | "locations"
    | "catalogRequests";

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
        roles: ["admin", "superAdmin", "moderator"],
        section: "Inventory",
        counterKey: "ads",
        aliases: ["/ads", "/services", "/spare-parts"],
    },
    {
        key: "businessMaster",
        label: "Business Master",
        icon: ShieldAlert,
        href: "/businesses?status=pending",
        roles: ["admin", "superAdmin", "moderator"],
        section: "Directory",
        counterKey: "businesses",
        aliases: ["/businesses", "/business-requests"],
    },
    {
        key: "reports",
        label: "Reports",
        icon: List,
        href: "/reports?status=open",
        roles: ["admin", "superAdmin", "moderator"],
        section: "Inventory",
        counterKey: "reports",
        aliases: ["/reports"],
    },
    {
        key: "masterData",
        label: "Device Catalog",
        icon: Layers,
        href: "/categories",
        roles: ["admin", "superAdmin"],
        section: "Master Data",
        aliases: [
            "/categories",
            "/brands",
            "/models",
            "/screen-sizes",
            "/service-types",
            "/catalog-requests",
            "/spare-parts-catalog",
        ],
    },
    {
        key: "locations",
        label: "Locations",
        icon: MapPin,
        href: "/locations",
        roles: ["admin", "superAdmin"],
        section: "Master Data",
        aliases: ["/locations", "/locations/analytics", "/locations/geofences"],
    },
    {
        key: "users",
        label: "User Management",
        icon: Users,
        href: "/users",
        roles: ["admin", "superAdmin", "moderator"],
        section: "Management",
        aliases: ["/users"],
    },
    {
        key: "notifications",
        label: "Notifications",
        icon: Bell,
        href: "/notifications",
        roles: ["admin", "superAdmin"],
        section: "Management",
        aliases: ["/notifications", "/smart-alerts"],
    },
    {
        key: "chatModeration",
        label: "Chat Moderation",
        icon: MessageSquare,
        href: "/chat",
        roles: ["admin", "superAdmin"],
        section: "Management",
        aliases: ["/chat"],
    },
    {
        key: "analytics",
        label: "Plans & Invoices",
        icon: BarChart3,
        section: "Management",
        href: "/plans",
        roles: ["admin", "superAdmin"],
        aliases: ["/finance", "/plans", "/invoices", "/revenue"],
    },
    {
        key: "administration",
        label: "System Administration",
        icon: ShieldCheck,
        href: "/admin-users",
        roles: ["superAdmin"],
        section: "System",
        aliases: ["/admin-users", "/admin-sessions", "/security/audit", "/api-keys"],
    },
    {
        key: "settings",
        label: "Settings",
        icon: Settings,
        href: "/settings",
        roles: ["superAdmin"],
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
