import { User } from "@/types/User";

import { can } from "@/permissions/can";

export function requireUserAuth(user: User) {
    if (!user) throw new Error("AUTH_REQUIRED");
}

export function requireBusinessAuth(user: User) {
    if (!can("accessBusinessDashboard", user)) {
        throw new Error("BUSINESS_ACCESS_DENIED");
    }
}
