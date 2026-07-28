export enum Role {
    USER = "user",
    BUSINESS = "business",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin",
    MODERATOR = "moderator",
}

export const ROLE_VALUES = Object.values(Role) as [Role, ...Role[]];
