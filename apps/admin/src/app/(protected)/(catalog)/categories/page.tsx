"use client";

import { Suspense } from "react";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { catalogManagementTabs } from "@/components/layout/adminModuleTabSets";
import DeviceCatalogTabs from "@/components/catalog/DeviceCatalogTabs";
import { Loader2 } from "lucide-react";

export default function CategoriesPage() {
    return (
        <div className="space-y-6">
            <AdminModuleTabs tabs={catalogManagementTabs} variant="pills" />
            <Suspense fallback={
                <div className="flex h-[400px] w-full items-center justify-center rounded-xl border border-slate-100 bg-white/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Loading Catalog...</p>
                    </div>
                </div>
            }>
                <DeviceCatalogTabs />
            </Suspense>
        </div>
    );
}
