"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PostAdWizard } from "@/components/user/post-ad/PostAdWizard";
import { getPageRoute, type UserPage } from "@/lib/routeUtils";
import { buildAccountListingRoute } from "@/lib/accountListingRoutes";
import { trackPostAdEvent } from "@/lib/analytics/trackPostAd";

function PostAdPageBackdrop() {
    return (
        <div className="fixed inset-0 overflow-hidden bg-slate-100/90 pointer-events-none select-none" inert>
            {/* Header Shell */}
            <header className="w-full bg-white border-b border-slate-200/80 px-4 py-3 sm:px-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base">E</div>
                    <span className="font-bold text-slate-900 text-lg tracking-tight">Esparex</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 max-w-md w-full mx-8">
                    <div className="w-full h-9 rounded-full bg-slate-100 border border-slate-200 px-4 flex items-center text-slate-400 text-sm">
                        Search spare parts, electronics, devices...
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-20 h-8 rounded-full bg-slate-100" />
                    <div className="w-24 h-9 rounded-xl bg-blue-600/10 border border-blue-200" />
                </div>
            </header>

            {/* Page Body Shell */}
            <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6 space-y-6">
                {/* Hero / Banner Preview */}
                <div className="w-full rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 p-6 sm:p-8 text-white shadow-md">
                    <div className="w-48 h-4 rounded bg-white/20 mb-3" />
                    <div className="w-80 max-w-full h-7 rounded bg-white/30 mb-4" />
                    <div className="flex gap-2">
                        <div className="w-28 h-9 rounded-lg bg-white/20" />
                        <div className="w-28 h-9 rounded-lg bg-white/10" />
                    </div>
                </div>

                {/* Category Grid Preview */}
                <div className="space-y-3">
                    <div className="w-36 h-5 rounded bg-slate-300" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {["Mobiles", "Laptops", "LED TVs", "Tablets", "Drones", "Audio"].map((cat, i) => (
                            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col items-center gap-2 shadow-sm">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                    {cat.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-xs font-semibold text-slate-700">{cat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Listing Cards Grid Preview */}
                <div className="space-y-3 pt-2">
                    <div className="w-44 h-5 rounded bg-slate-300" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3 shadow-sm">
                                <div className="w-full h-36 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 text-xs font-medium">
                                    Product Image
                                </div>
                                <div className="space-y-1.5">
                                    <div className="w-3/4 h-4 rounded bg-slate-200" />
                                    <div className="w-1/2 h-3 rounded bg-slate-100" />
                                    <div className="w-1/3 h-5 rounded bg-blue-100 mt-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function PostAdPageClient() {
    const router = useRouter();

    useEffect(() => {
        trackPostAdEvent({ event: "post_ad_opened", source: "navbar" });
    }, []);

    const navigateTo = (page: UserPage, adId?: string | number) => {
        if (page === "my-ads") {
            void router.push(buildAccountListingRoute("ads", "pending"));
            return;
        }
        const route = getPageRoute(page, { adId });
        void router.push(route);
    };

    return (
        <div className="relative min-h-screen">
            <PostAdPageBackdrop />
            <PostAdWizard navigateTo={navigateTo} />
        </div>
    );
}
