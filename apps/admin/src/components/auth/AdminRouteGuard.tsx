"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ADMIN_UI_ROUTES } from "@/lib/adminUiRoutes";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, loading, error, refresh } = useAdminAuth();

  useEffect(() => {
    if (!loading && !admin && !error) {
      const nextPath =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}${window.location.hash}`
          : pathname || "/";
      void router.replace(ADMIN_UI_ROUTES.login(nextPath));
    }
  }, [admin, loading, error, pathname, router]);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading admin session...</div>;
  }




  if (error && !admin) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <h2 style={{ color: "#e11d48", marginBottom: 16 }}>Connection Error</h2>
        <p style={{ marginBottom: 24, color: "#4b5563" }}>
          We're having trouble connecting to the administration server.
          <br />
          {error.message}
        </p>
        <button
          onClick={() => refresh()}
          style={{
            backgroundColor: "#0f172a",
            color: "white",
            padding: "10px 24px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!admin) return null;


  return <>{children}</>;
}
