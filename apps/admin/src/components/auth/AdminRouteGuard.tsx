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
    return <div className="p-6 text-sm text-foreground-secondary">Loading admin session...</div>;
  }




  if (error && !admin) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold text-rose-600 dark:text-rose-500 mb-4">Connection Error</h2>
        <p className="text-sm text-muted-foreground mb-6">
          We&apos;re having trouble connecting to the administration server.
          <br />
          {error.message}
        </p>
        <button
          onClick={() => refresh()}
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          Try Again
        </button>
      </div>
    );

  }

  if (!admin) return null;


  return <>{children}</>;
}
