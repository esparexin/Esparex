export enum Role {
    USER = "user",
    BUSINESS = "business",
    ADMIN = "admin",
    SUPER_ADMIN = "superAdmin",
    MODERATOR = "moderator",
}

export const ROLE_VALUES = Object.values(Role) as [Role, ...Role[]];
