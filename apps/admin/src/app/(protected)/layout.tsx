"use client";

import { useEffect, useState } from "react";
import { AdminRouteGuard } from "@/components/auth/AdminRouteGuard";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { PageLayout } from "@esparex/ui";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [isMinified, setIsMinified] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("esparex_admin_sidebar_minified");
    if (saved === "true") {
      void (async () => { setIsMinified(true); })();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("esparex_admin_sidebar_minified", String(isMinified));
  }, [isMinified]);

  return (
    <AdminRouteGuard>
      <PageLayout
        variant="admin"
        header={
          <AdminHeader 
            onMobileMenuClick={() => setIsMobileOpen(true)}
          />
        }
        sidebar={
          <AdminSidebar
            isMinified={isMinified}
            setIsMinified={setIsMinified}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
          />
        }
      >
        {children}
      </PageLayout>
    </AdminRouteGuard>
  );
}
