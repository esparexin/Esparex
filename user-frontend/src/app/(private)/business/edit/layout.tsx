import { ReactNode } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function BusinessEditLayout({ children }: { children: ReactNode }) {
    return <AuthGuard>{children}</AuthGuard>;
}
