"use client";

import { useEffect, useState } from "react";
import { AdminRouteGuard } from "@/components/auth/AdminRouteGuard";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [isMinified, setIsMinified] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("esparex_admin_sidebar_minified");
    if (saved === "true") {
      setIsMinified(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("esparex_admin_sidebar_minified", String(isMinified));
  }, [isMinified]);

  return (
    <AdminRouteGuard>
      <div
        className="flex min-h-screen min-h-dvh overflow-x-hidden bg-[radial-gradient(circle_at_top,#e2e8f0_0%,#f8fafc_30%,#f8fafc_100%)] [--sidebar-expanded:260px] [--sidebar-collapsed:72px] lg:h-screen lg:overflow-hidden"
        style={{
          ["--sidebar-width" as string]: isMinified ? "var(--sidebar-collapsed)" : "var(--sidebar-expanded)",
        }}
      >
        <AdminSidebar
          isMinified={isMinified}
          setIsMinified={setIsMinified}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-visible lg:overflow-hidden">
          <AdminHeader />
          <main className="flex flex-1 min-h-0 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain px-4 pb-24 pt-4 lg:px-8 lg:pb-8 lg:pt-6">
            <div className="flex min-h-full flex-1 flex-col">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
