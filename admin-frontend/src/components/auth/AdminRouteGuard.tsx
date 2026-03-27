"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ADMIN_UI_ROUTES } from "@/lib/adminUiRoutes";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, loading } = useAdminAuth();

  useEffect(() => {
    if (!loading && !admin) {
      const nextPath =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}${window.location.hash}`
          : pathname || "/";
      void router.replace(ADMIN_UI_ROUTES.login(nextPath));
    }
  }, [admin, loading, pathname, router]);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading admin session...</div>;
  }

  if (!admin) return null;

  return <>{children}</>;
}
