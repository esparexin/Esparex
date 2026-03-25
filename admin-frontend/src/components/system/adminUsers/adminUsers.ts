export type AdminRole = "super_admin" | "admin" | "moderator";
export type AdminStatus = "live" | "inactive" | "suspended" | "banned";

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

export type AdminFormState = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: AdminRole;
    status: AdminStatus;
    permissionsText: string;
};

export type EditableAdminFormState = Omit<AdminFormState, "password">;

export type AdminUserFormValues = {
    firstName: string;
    lastName: string;
    email: string;
    role: AdminRole;
    permissionsText: string;
    password?: string;
    status?: AdminStatus;
};

export const DEFAULT_CREATE_FORM: AdminFormState = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "moderator",
    status: "live",
    permissionsText: "",
};

export const DEFAULT_EDIT_FORM: EditableAdminFormState = {
    firstName: "",
    lastName: "",
    email: "",
    role: "moderator",
    status: "live",
    permissionsText: "",
};

export const ROLE_COLORS: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700",
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
    return {
        id,
        firstName: String(raw.firstName || ""),
        lastName: String(raw.lastName || ""),
        email: String(raw.email || ""),
        role: String(raw.role || "admin"),
        status: String(raw.status || "active"),
        permissions: Array.isArray(raw.permissions)
            ? raw.permissions.filter((item): item is string => typeof item === "string")
            : [],
        lastLogin: typeof raw.lastLogin === "string" ? raw.lastLogin : undefined,
        createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    };
}

export function getAdminStatusPresentation(status: string) {
    switch (status) {
        case "inactive":
            return { status: "deactivated", label: "Inactive" };
        case "suspended":
            return { status: "pending", label: "Suspended" };
        case "banned":
            return { status: "blocked", label: "Banned" };
        case "live":
        default:
            return { status: "live", label: "Live" };
    }
}

export function getAdminDisplayName(admin: Pick<ManagedAdmin, "firstName" | "lastName" | "email">) {
    return `${admin.firstName} ${admin.lastName}`.trim() || admin.email;
}
