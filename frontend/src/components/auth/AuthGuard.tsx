"use client";

"use client";
import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AuthGuardProps {
    children: ReactNode;
}

export function AuthGuard({
    children
}: AuthGuardProps) {
    const { user, status } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // 1. Wait for loading
        if (status === "loading") return;

        // 2. Unauthenticated check
        if (status === "unauthenticated" || !user) {
            const callbackUrl = encodeURIComponent(pathname || "/");
            void router.replace(`/login?callbackUrl=${callbackUrl}`);
            return;
        }
    }, [status, user, router, pathname]);

    // Render checks (passive only)
    if (status === "loading") return null;
    if (!user) return null;

    return <>{children}</>;
}
