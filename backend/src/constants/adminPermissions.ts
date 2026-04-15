import { Role } from '@shared/enums/roles';

export type AdminRole =
    | Role.SUPER_ADMIN
    | Role.ADMIN
    | Role.MODERATOR
    | 'user_manager'
    | 'finance_manager'
    | 'content_moderator'
    | 'editor'
    | 'viewer'
    | 'custom';

export const ADMIN_PERMISSION_KEYS = {
    ADS_APPROVE: 'ads:write',
    ADS_DELETE: 'ads:write',
    CHAT_READ: 'chat:read',
    CHAT_WRITE: 'chat:write',
    USERS_WARN: 'users:write',
    USERS_SUSPEND: 'users:write',
    USERS_BAN: 'users:write',
    BUSINESS_APPROVE: 'users:write',
    CATALOG_EDIT: 'catalog:write',
    ADMIN_CREATE: 'system:config',
    ADMIN_SUSPEND: 'system:config',
    SYSTEM_LOGS: 'system:logs',
    SERVICES_READ: 'services:read',
    SERVICES_WRITE: 'services:write',
    PARTS_READ: 'parts:read',
    PARTS_WRITE: 'parts:write',
} as const;



const PERMISSION_ROLE_ALLOWLIST: Record<string, AdminRole[]> = {
    'users:read': [Role.ADMIN, 'user_manager', 'viewer', Role.MODERATOR, 'content_moderator'],
    'users:write': [Role.ADMIN, 'user_manager'],
    'ads:read': [Role.ADMIN, Role.MODERATOR, 'content_moderator', 'viewer'],
    'ads:write': [Role.ADMIN, Role.MODERATOR, 'content_moderator'],
    'business:approve': [Role.ADMIN, 'user_manager'],
    'catalog:read': [Role.ADMIN, Role.MODERATOR, 'content_moderator', 'viewer'],
    'catalog:write': [Role.ADMIN, 'content_moderator', 'editor'],
    'services:read': [Role.ADMIN, Role.MODERATOR, 'content_moderator', 'viewer'],
    'services:write': [Role.ADMIN, Role.MODERATOR, 'content_moderator'],
    'parts:read': [Role.ADMIN, Role.MODERATOR, 'content_moderator', 'viewer'],
    'parts:write': [Role.ADMIN, Role.MODERATOR, 'content_moderator'],
    'chat:read': [Role.ADMIN, Role.MODERATOR, 'content_moderator', 'viewer'],
    'chat:write': [Role.ADMIN, Role.MODERATOR, 'content_moderator'],
    'content:read': [Role.ADMIN, Role.MODERATOR, 'content_moderator', 'viewer'],
    'content:write': [Role.ADMIN, Role.MODERATOR, 'content_moderator', 'editor'],
    'finance:read': [Role.ADMIN, 'finance_manager'],
    'finance:manage': [Role.ADMIN, 'finance_manager'],
    'system:logs': [Role.ADMIN],
    'system:config': [Role.ADMIN],
};

const normalizePermission = (permission: string): string =>
    ADMIN_PERMISSION_KEYS[permission as keyof typeof ADMIN_PERMISSION_KEYS] || permission;

export const roleGrantsPermission = (role: string | undefined, permission: string): boolean => {
    if (!role) return false;
    if ((role as Role) === Role.SUPER_ADMIN) return true;

    const normalizedPermission = normalizePermission(permission);
    const roleAllowlist = PERMISSION_ROLE_ALLOWLIST[normalizedPermission];
    if (!roleAllowlist) return false;

    return roleAllowlist.includes(role as AdminRole);
};

export const normalizeAdminPermission = normalizePermission;
