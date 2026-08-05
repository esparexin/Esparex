"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Bell, LogOut, ShieldCheck, Menu } from "@esparex/ui";


const SECTION_META: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
        title: "Dashboard",
        subtitle: "Platform overview, health signals, and moderation velocity.",
    },
    ads: {
        title: "Listings",
        subtitle: "Review listings, risk indicators, and live inventory.",
    },
    users: {
        title: "Users",
        subtitle: "Manage user lifecycle, verification state, and account controls.",
    },

    services: {
        title: "Services",
        subtitle: "Manage repair services, coverage, and listing quality.",
    },
    reports: {
        title: "Reports",
        subtitle: "Track abuse signals, escalations, and resolution workflows.",
    },
    notifications: {
        title: "Notifications",
        subtitle: "Coordinate outbound messages, delivery channels, and comms health.",
    },
    chat: {
        title: "Chat Moderation",
        subtitle: "Monitor and moderate buyer-seller conversations across the marketplace.",
    },
    finance: {
        title: "Transactions",
        subtitle: "Monitor transaction health, payment outcomes, and finance operations.",
    },
    invoices: {
        title: "Invoices",
        subtitle: "Review generated invoices, GST billing records, and downloadable PDFs.",
    },
    plans: {
        title: "Plans",
        subtitle: "Manage subscription plans, ad packs, spotlight credits, and smart alerts.",
    },
    revenue: {
        title: "Revenue",
        subtitle: "Track monetization performance, revenue breakdowns, and growth trends.",
    },
    businesses: {
        title: "Business Master",
        subtitle: "Manage pending, live, suspended, deleted, and historical business accounts in one place.",
    },
    locations: {
        title: "Locations",
        subtitle: "Manage geographic data, hot zones, and location analytics.",
    },
    categories: {
        title: "Device Catalog",
        subtitle: "Manage device categories, brands, models, and screen sizes.",
    },
    brands: {
        title: "Device Catalog",
        subtitle: "Manage device categories, brands, models, and screen sizes.",
    },
    models: {
        title: "Device Catalog",
        subtitle: "Manage device categories, brands, models, and screen sizes.",
    },
    catalog: {
        title: "Device Catalog",
        subtitle: "Manage device categories, brands, models, and screen sizes.",
    },
    "spare-parts-catalog": {
        title: "Spare Parts Master",
        subtitle: "Manage the spare parts catalog and compatibility matrix.",
    },
    "catalog-requests": {
        title: "Catalog Requests",
        subtitle: "Review user-submitted brand and model requests, then approve, reject, or mark duplicates.",
    },
    "admin-users": {
        title: "Administration",
        subtitle: "Control operator access, roles, and privileged account governance.",
    },
    settings: {
        title: "Settings",
        subtitle: "Adjust platform configuration and operational controls safely.",
    },
};

interface AdminHeaderProps {
    onMobileMenuClick?: () => void;
}

export function AdminHeader({ onMobileMenuClick }: AdminHeaderProps = {}) {
    const { admin, logout } = useAdminAuth();
    const pathname = usePathname();

    const sectionMeta = useMemo(() => {
        const firstSegment = pathname.split("/").filter(Boolean)[0] || "dashboard";
        return SECTION_META[firstSegment] || {
            title: "Administration",
            subtitle: "Manage marketplace operations, configuration, and oversight.",
        };
    }, [pathname]);

    const todayLabel = useMemo(
        () =>
            new Intl.DateTimeFormat("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
            }).format(new Date()),
        []
    );

    const isCompactRoute = useMemo(() => {
        const segments = pathname.split("/").filter(Boolean);
        if (segments.length === 0) return false;
        
        // Define which base routes should use the dense / compact header
        // This suppresses the duplicate title/subtitle/search block because the
        // page shell (AdminPageShell) or the screen itself handles its own density.
        const compactRoutes = [
            "ads",
            "spare-parts",
            "reports",
            "services",
            "chat"
        ];
        const firstSegment = segments[0];
        if (!firstSegment) return false;

        return compactRoutes.includes(firstSegment);
    }, [pathname]);
    return (
        <header className="sticky top-0 z-30 shrink-0 border-b border-border/80 bg-background/90 backdrop-blur">
            <div className="flex flex-col gap-3 px-4 py-3 lg:px-8">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="mb-2 inline-flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onMobileMenuClick}
                                className="lg:hidden mr-2 p-1 text-foreground-secondary hover:text-foreground transition-colors"
                                aria-label="Open navigation menu"
                            >
                                <Menu size={20} />
                            </button>
                            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-tiny font-semibold uppercase tracking-[0.14em] text-sky-700">
                                <ShieldCheck size={13} />
                                Admin Console
                            </div>
                        </div>
                        {!isCompactRoute && (
                            <>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <h1 className="text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
                                        {sectionMeta.title}
                                    </h1>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-foreground-subtle">
                                        {todayLabel}
                                    </span>
                                </div>
                                <p className="mt-1 max-w-2xl text-sm text-foreground-tertiary">
                                    {sectionMeta.subtitle}
                                </p>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="relative rounded-full border border-border bg-card p-2.5 text-foreground-tertiary shadow-sm transition-colors hover:bg-accent hover:text-foreground">
                            <Bell size={18} />
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-card bg-rose-500"></span>
                        </button>

                        <div className="hidden items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm sm:flex">
                            <div className="text-right">
                                <p className="text-sm font-semibold leading-none text-foreground">
                                    {admin?.firstName} {admin?.lastName}
                                </p>
                                <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-tiny font-bold uppercase tracking-[0.14em] text-foreground-secondary">
                                    {admin?.role}
                                </span>
                            </div>
                            <button
                                onClick={() => void logout()}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground-secondary transition-all hover:bg-rose-50 hover:text-rose-600"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {!isCompactRoute && (
                    <div className="flex items-center gap-3">


                        <div className="flex items-center gap-2 sm:hidden">
                            <span className="rounded-full bg-muted px-2.5 py-1 text-tiny font-bold uppercase tracking-[0.14em] text-foreground-secondary">
                                {admin?.role}
                            </span>
                            <button
                                onClick={() => void logout()}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground-secondary shadow-sm transition-all hover:bg-rose-50 hover:text-rose-600"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
