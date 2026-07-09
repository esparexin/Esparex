"use client";

import type { User } from "@/types/User";
import type { Business as UserBusiness } from "@/lib/api/user/businesses";
import { BusinessRegistrationFlow } from "./registration-flow";
import { BusinessEditProfileFlow } from "./edit-flow";

interface Props {
    mode: "registration" | "edit";
    user: User | null;
    initialBusiness?: UserBusiness | null;
    onRefreshUser?: () => void | Promise<void>;
    onComplete?: () => void;
    onClose?: () => void;
}

export function BusinessProfileFlow(props: Props) {
    if (props.mode === "registration") return <BusinessRegistrationFlow user={props.user} onRefreshUser={props.onRefreshUser} onComplete={props.onComplete} onClose={props.onClose} />;
    return <BusinessEditProfileFlow user={props.user} initialBusiness={props.initialBusiness} onRefreshUser={props.onRefreshUser} onComplete={props.onComplete} onClose={props.onClose} />;
}
