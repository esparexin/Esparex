export interface PermissionScope {
    key: string;
    label: string;
}

export interface PermissionGroup {
    name: string;
    description: string;
    scopes: PermissionScope[];
}

export const CANONICAL_PERMISSION_GROUPS: PermissionGroup[] = [
    {
        name: "General & Super",
        description: "Unrestricted global access",
        scopes: [
            { key: "all", label: "Full System Access (all)" },
        ],
    },
    {
        name: "User Management",
        description: "Manage users, verification, and bans",
        scopes: [
            { key: "users:read", label: "View Users" },
            { key: "users:write", label: "Edit Users" },
            { key: "users:verify", label: "Verify Users" },
            { key: "users:ban", label: "Ban / Suspend" },
            { key: "users:delete", label: "Delete Users" },
            { key: "users:sys_admin", label: "System User Admin" },
        ],
    },
    {
        name: "Listings & Ads",
        description: "Ad moderation and approvals",
        scopes: [
            { key: "ads:read", label: "View Ads" },
            { key: "ads:write", label: "Moderate & Edit Ads" },
            { key: "business:approve", label: "Approve Businesses" },
        ],
    },
    {
        name: "Catalog & Taxonomy",
        description: "Categories, brands, models, and spare parts",
        scopes: [
            { key: "catalog:read", label: "View Catalog" },
            { key: "catalog:write", label: "Edit Catalog & Requests" },
            { key: "services:read", label: "View Services" },
            { key: "services:write", label: "Edit Services" },
            { key: "parts:read", label: "View Parts" },
            { key: "parts:write", label: "Edit Parts" },
        ],
    },
    {
        name: "Communications & Chat",
        description: "Chat monitoring and report moderation",
        scopes: [
            { key: "chat:read", label: "View Chats" },
            { key: "chat:write", label: "Mute & Moderate Chat" },
            { key: "content:read", label: "View CMS Content" },
            { key: "content:write", label: "Edit CMS Content" },
        ],
    },
    {
        name: "Finance & System",
        description: "Invoices, transactions, logs, and settings",
        scopes: [
            { key: "finance:read", label: "View Financials" },
            { key: "finance:manage", label: "Manage Plans & Invoices" },
            { key: "system:logs", label: "View Audit Logs" },
            { key: "system:config", label: "System Configuration" },
        ],
    },
];

export const PERMISSION_PRESETS = {
    super: ["all"],
    admin: [
        "users:read", "users:write", "users:verify", "users:ban",
        "ads:read", "ads:write", "business:approve",
        "catalog:read", "catalog:write", "services:read", "services:write", "parts:read", "parts:write",
        "chat:read", "chat:write", "content:read", "content:write",
        "finance:read", "system:logs"
    ],
    moderator: [
        "users:read", "ads:read", "ads:write",
        "catalog:read", "catalog:write", "services:read", "parts:read",
        "chat:read", "chat:write", "content:read"
    ],
} as const;
