"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, loading } = useAdminAuth();

  useEffect(() => {
    if (!loading && !admin) {
      const nextPath = encodeURIComponent(pathname || "/");
      void router.replace(`/login?next=${nextPath}`);
    }
  }, [admin, loading, pathname, router]);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading admin session...</div>;
  }

  if (!admin) return null;

  return <>{children}</>;
}
