"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";

export default function PostAdLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            {children}
        </AuthGuard>
    );
}
