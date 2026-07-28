"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PostAdWizard } from "@/components/user/post-ad/PostAdWizard";
import { getPageRoute, type UserPage } from "@/lib/routeUtils";
import { buildAccountListingRoute } from "@/lib/accountListingRoutes";
import { trackPostAdEvent } from "@/lib/analytics/trackPostAd";

function PostAdPageBackdrop() {
    return (
        <div className="fixed inset-0 overflow-hidden bg-slate-50 pointer-events-none select-none" aria-hidden="true">
            {/* Header Shell */}
            <header className="w-full bg-white border-b border-slate-200 px-4 py-3 sm:px-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base">E</div>
                    <span className="font-bold text-slate-900 text-lg tracking-tight">Esparex Marketplace</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 max-w-md w-full mx-8">
                    <div className="w-full h-9 rounded-full bg-slate-100 border border-slate-200 px-4 flex items-center text-slate-500 text-sm">
                        🔍 Search mobile spare parts, displays, tools...
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600">Location: Mumbai</span>
                    <div className="w-24 h-9 rounded-xl bg-blue-600 text-white font-semibold text-xs flex items-center justify-center">
                        + Post Ad
                    </div>
                </div>
            </header>

            {/* Page Body Shell */}
            <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6 space-y-6">
                {/* Hero Banner */}
                <div className="w-full rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 p-6 sm:p-8 text-white shadow-md">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-200">VERIFIED SUPPLIERS MARKETPLACE</span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Buy & Sell Electronics Spare Parts</h1>
                    <p className="text-sm text-blue-100 mt-2 max-w-xl">Find genuine mobile displays, IC chips, battery replacements, and repair tools directly from verified wholesalers.</p>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                    <h2 className="text-base font-bold text-slate-900">Explore Categories</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {[
                            { name: "Mobiles", count: "12,400+ Ads" },
                            { name: "Laptops", count: "8,100+ Ads" },
                            { name: "LED TVs", count: "3,200+ Ads" },
                            { name: "Tablets", count: "2,500+ Ads" },
                            { name: "Drones", count: "950+ Ads" },
                            { name: "Audio & ICs", count: "5,600+ Ads" }
                        ].map((cat, i) => (
                            <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col items-center text-center gap-1 shadow-sm">
                                <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                                <span className="text-[10px] text-slate-500">{cat.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Featured Listings Grid */}
                <div className="space-y-3 pt-2">
                    <h2 className="text-base font-bold text-slate-900">Featured Spare Parts</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { title: "iPhone 15 Pro OLED Screen Assembly", price: "₹4,999", loc: "Andheri, Mumbai" },
                            { title: "MacBook Pro M2 Logic Board 16GB", price: "₹18,500", loc: "Nehru Place, Delhi" },
                            { title: "Samsung S23 Ultra Original Battery", price: "₹1,299", loc: "SP Road, Bengaluru" },
                            { title: "Universal IC Reballing Stencil Kit", price: "₹799", loc: "Richi Street, Chennai" }
                        ].map((item, i) => (
                            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2 shadow-sm">
                                <div className="w-full h-32 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-medium border border-slate-200/60">
                                    [ Spare Part Photo ]
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-900 truncate">{item.title}</div>
                                    <div className="text-sm font-extrabold text-blue-600 mt-1">{item.price}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">{item.loc}</div>
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
