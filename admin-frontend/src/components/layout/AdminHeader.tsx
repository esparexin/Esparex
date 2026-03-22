"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Bell, LogOut, ShieldCheck } from "lucide-react";


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

    "business-requests": {
        title: "Businesses",
        subtitle: "Process business onboarding, approvals, and account quality.",
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
        title: "Plans & Invoices",
        subtitle: "Monitor revenue, payments, and marketplace performance trends.",
    },
    invoices: {
        title: "Plans & Invoices",
        subtitle: "Review generated invoices, GST billing records, and downloadable PDFs.",
    },
    plans: {
        title: "Plans & Invoices",
        subtitle: "Manage subscription plans, ad packs, spotlight credits, and smart alerts.",
    },
    revenue: {
        title: "Plans & Invoices",
        subtitle: "Track monetization performance across plans, invoices, and transactions.",
    },
    businesses: {
        title: "Business Master",
        subtitle: "View and manage all approved business accounts on the platform.",
    },
    locations: {
        title: "Locations",
        subtitle: "Manage geographic data, hot zones, and location analytics.",
    },
    categories: {
        title: "Device Taxonomy",
        subtitle: "Manage device categories, brands, models, and screen sizes.",
    },
    brands: {
        title: "Device Taxonomy",
        subtitle: "Manage device categories, brands, models, and screen sizes.",
    },
    models: {
        title: "Device Taxonomy",
        subtitle: "Manage device categories, brands, models, and screen sizes.",
    },
    taxonomy: {
        title: "Device Taxonomy",
        subtitle: "Manage device categories, brands, models, and screen sizes.",
    },
    "spare-parts-catalog": {
        title: "Spare Parts Master",
        subtitle: "Manage the spare parts catalog and compatibility matrix.",
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

export function AdminHeader() {
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
            "spare-parts",
            "reports",
            "business-requests",
            "services",
            "messages"
        ];
        const firstSegment = segments[0];
        if (!firstSegment) return false;

        return compactRoutes.includes(firstSegment);
    }, [pathname]);
    return (
        <header className="relative z-30 shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 lg:px-8">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">
                            <ShieldCheck size={13} />
                            Admin Console
                        </div>
                        {!isCompactRoute && (
                            <>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <h1 className="text-xl font-semibold tracking-tight text-slate-950 lg:text-2xl">
                                        {sectionMeta.title}
                                    </h1>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                                        {todayLabel}
                                    </span>
                                </div>
                                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                                    {sectionMeta.subtitle}
                                </p>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="relative rounded-full border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700">
                            <Bell size={18} />
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500"></span>
                        </button>

                        <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
                            <div className="text-right">
                                <p className="text-sm font-semibold leading-none text-slate-900">
                                    {admin?.firstName} {admin?.lastName}
                                </p>
                                <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                                    {admin?.role}
                                </span>
                            </div>
                            <button
                                onClick={() => void logout()}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-600"
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
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                                {admin?.role}
                            </span>
                            <button
                                onClick={() => void logout()}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-rose-50 hover:text-rose-600"
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
