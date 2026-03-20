import { ReactNode } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function AccountLayout({ children }: { children: ReactNode }) {
    return <AuthGuard>{children}</AuthGuard>;
}
