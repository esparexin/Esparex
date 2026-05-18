import { CHAT_STATUS, LIFECYCLE_STATUS, USER_STATUS } from "@shared";

export type AdminRole = "superAdmin" | "admin" | "moderator";
export const ADMIN_STATUS_OPTIONS = [
    USER_STATUS.LIVE,
    USER_STATUS.INACTIVE,
    USER_STATUS.SUSPENDED,
    USER_STATUS.BANNED,
] as const;
export type AdminStatus = (typeof ADMIN_STATUS_OPTIONS)[number];

export type ManagedAdmin = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: string;
    permissions: string[];
    lastLogin?: string;
    createdAt?: string;
};

export type AdminCreateFormState = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: AdminRole;
    permissionsText: string;
};

export type AdminEditFormState = {
    firstName: string;
    lastName: string;
    email: string;
    role: AdminRole;
    permissionsText: string;
    status: AdminStatus;
};

export type AdminUserFormValues = Partial<AdminCreateFormState & AdminEditFormState>;

export const DEFAULT_CREATE_FORM: AdminCreateFormState = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "moderator",
    permissionsText: "",
};

export const DEFAULT_EDIT_FORM: AdminEditFormState = {
    firstName: "",
    lastName: "",
    email: "",
    role: "moderator",
    status: USER_STATUS.LIVE,
    permissionsText: "",
};

export const ROLE_COLORS: Record<string, string> = {
    superAdmin: "bg-purple-100 text-purple-700",
    admin: "bg-blue-100 text-blue-700",
    moderator: "bg-amber-100 text-amber-700",
    user_manager: "bg-teal-100 text-teal-700",
    finance_manager: "bg-green-100 text-green-700",
    content_moderator: "bg-orange-100 text-orange-700",
    editor: "bg-sky-100 text-sky-700",
    viewer: "bg-slate-100 text-slate-600",
};

export function normalizeAdmin(raw: Record<string, unknown>): ManagedAdmin {
    const id = String(raw.id || raw._id || "");
    const rawRole = String(raw.role || "admin");
    return {
        id,
        firstName: String(raw.firstName || ""),
        lastName: String(raw.lastName || ""),
        email: String(raw.email || ""),
        role: rawRole === "super_admin" ? "superAdmin" : rawRole,
        status: String(raw.status || CHAT_STATUS.ACTIVE),
        permissions: Array.isArray(raw.permissions)
            ? raw.permissions.filter((item): item is string => typeof item === "string")
            : [],
        lastLogin: typeof raw.lastLogin === "string" ? raw.lastLogin : undefined,
        createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    };
}

export function getAdminStatusPresentation(status: string) {
    switch (status) {
        case USER_STATUS.INACTIVE:
            return { status: LIFECYCLE_STATUS.DEACTIVATED, label: "Inactive" };
        case USER_STATUS.SUSPENDED:
            return { status: LIFECYCLE_STATUS.PENDING, label: "Suspended" };
        case USER_STATUS.BANNED:
            return { status: CHAT_STATUS.BLOCKED, label: "Banned" };
        case USER_STATUS.LIVE:
        default:
            return { status: LIFECYCLE_STATUS.LIVE, label: "Live" };
    }
}

export function getAdminDisplayName(admin: Pick<ManagedAdmin, "firstName" | "lastName" | "email">) {
    return `${admin.firstName} ${admin.lastName}`.trim() || admin.email;
}

export function parsePermissionsText(permissionsText: string) {
    return permissionsText
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
}

export function toEditableAdminFormState(admin: ManagedAdmin): AdminEditFormState {
    const normalizedStatus = admin.status as AdminStatus;
    return {
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: (["superAdmin", "admin", "moderator"].includes(admin.role) ? admin.role : "moderator") as AdminRole,
        status: ADMIN_STATUS_OPTIONS.includes(normalizedStatus) ? normalizedStatus : USER_STATUS.LIVE,
        permissionsText: admin.permissions.join(", "),
    };
}
