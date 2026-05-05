export enum Role {
    USER = "user",
    BUSINESS = "business",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin",
    MODERATOR = "moderator",
    EDITOR = "editor",
    VIEWER = "viewer",
    USER_MANAGER = "user_manager",
    FINANCE_MANAGER = "finance_manager",
    CONTENT_MODERATOR = "content_moderator",
    CUSTOM = "custom"
}

export const ROLE_VALUES = Object.values(Role) as [Role, ...Role[]];
