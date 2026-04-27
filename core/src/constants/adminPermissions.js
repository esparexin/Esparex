"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeAdminPermission = exports.roleGrantsPermission = exports.ADMIN_PERMISSION_KEYS = void 0;
const roles_1 = require("@core/constants/enums/roles");
exports.ADMIN_PERMISSION_KEYS = {
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
};
const PERMISSION_ROLE_ALLOWLIST = {
    'users:read': [roles_1.Role.ADMIN, 'user_manager', 'viewer', roles_1.Role.MODERATOR, 'content_moderator'],
    'users:write': [roles_1.Role.ADMIN, 'user_manager'],
    'ads:read': [roles_1.Role.ADMIN, roles_1.Role.MODERATOR, 'content_moderator', 'viewer'],
    'ads:write': [roles_1.Role.ADMIN, roles_1.Role.MODERATOR, 'content_moderator'],
    'business:approve': [roles_1.Role.ADMIN, 'user_manager'],
    'catalog:read': [roles_1.Role.ADMIN, roles_1.Role.MODERATOR, 'content_moderator', 'viewer'],
    'catalog:write': [roles_1.Role.ADMIN, 'content_moderator', 'editor'],
    'services:read': [roles_1.Role.ADMIN, roles_1.Role.MODERATOR, 'content_moderator', 'viewer'],
    'services:write': [roles_1.Role.ADMIN, roles_1.Role.MODERATOR, 'content_moderator'],
    'parts:read': [roles_1.Role.ADMIN, roles_1.Role.MODERATOR, 'content_moderator', 'viewer'],
    'parts:write': [roles_1.Role.ADMIN, roles_1.Role.MODERATOR, 'content_moderator'],
    'chat:read': [roles_1.Role.ADMIN, roles_1.Role.MODERATOR, 'content_moderator', 'viewer'],
    'chat:write': [roles_1.Role.ADMIN, roles_1.Role.MODERATOR, 'content_moderator'],
    'content:read': [roles_1.Role.ADMIN, roles_1.Role.MODERATOR, 'content_moderator', 'viewer'],
    'content:write': [roles_1.Role.ADMIN, roles_1.Role.MODERATOR, 'content_moderator', 'editor'],
    'finance:read': [roles_1.Role.ADMIN, 'finance_manager'],
    'finance:manage': [roles_1.Role.ADMIN, 'finance_manager'],
    'system:logs': [roles_1.Role.ADMIN],
    'system:config': [roles_1.Role.ADMIN],
};
const normalizePermission = (permission) => exports.ADMIN_PERMISSION_KEYS[permission] || permission;
const roleGrantsPermission = (role, permission) => {
    if (!role)
        return false;
    if (role === roles_1.Role.SUPER_ADMIN)
        return true;
    const normalizedPermission = normalizePermission(permission);
    const roleAllowlist = PERMISSION_ROLE_ALLOWLIST[normalizedPermission];
    if (!roleAllowlist)
        return false;
    return roleAllowlist.includes(role);
};
exports.roleGrantsPermission = roleGrantsPermission;
exports.normalizeAdminPermission = normalizePermission;
//# sourceMappingURL=adminPermissions.js.map