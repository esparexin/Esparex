"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { catalogManagementTabs } from "@/components/layout/adminModuleTabSets";
import { getCatalogHierarchyTree, type HierarchyTreeCategoryNode } from "@/lib/api/catalogGovernance";
import { getListingTypeIcon } from "@/components/catalog/CatalogUiPrimitives";
import {
    ChevronRight,
    ChevronDown,
    Smartphone,
    Box,
    CheckCircle,
    XCircle,
    AlertCircle,
    Layers,
} from "lucide-react";

const StatusDot = ({ isActive }: { isActive: boolean }) =>
    isActive ? (
        <CheckCircle size={12} className="text-emerald-500 shrink-0" />
    ) : (
        <XCircle size={12} className="text-slate-400 shrink-0" />
    );

const CountBadge = ({ count, label }: { count: number; label: string }) => (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
        {count} {label}
    </span>
);

const summaryCardStyles: Record<
    "categories" | "brands" | "models",
    { icon: JSX.Element; iconClassName: string }
> = {
    categories: {
        icon: <Layers size={18} />,
        iconClassName: "bg-indigo-50 text-indigo-600",
    },
    brands: {
        icon: <Smartphone size={18} />,
        iconClassName: "bg-sky-50 text-sky-600",
    },
    models: {
        icon: <Box size={18} />,
        iconClassName: "bg-violet-50 text-violet-600",
    },
};

export default function TaxonomyHierarchyPage() {
    const [hierarchy, setHierarchy] = useState<HierarchyTreeCategoryNode[]>([]);
    const [summary, setSummary] = useState({ categories: 0, brands: 0, models: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
    const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});
    const [search, setSearch] = useState("");

    useEffect(() => {
        let isCancelled = false;
        setLoading(true);
        setError(null);

        void getCatalogHierarchyTree()
            .then((data) => {
                if (isCancelled) return;
                setHierarchy(data.categories);
                setSummary(data.summary);
            })
            .catch((loadError) => {
                if (isCancelled) return;
                setError(loadError instanceof Error ? loadError.message : "Failed to load hierarchy");
            })
            .finally(() => {
                if (!isCancelled) {
                    setLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, []);

    const filteredHierarchy = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        if (!normalizedSearch) {
            return hierarchy;
        }

        return hierarchy.filter((category) =>
            category.name.toLowerCase().includes(normalizedSearch) ||
            category.slug.toLowerCase().includes(normalizedSearch)
        );
    }, [hierarchy, search]);

    const toggleCategory = (id: string) =>
        setExpandedCats((prev) => ({ ...prev, [id]: !prev[id] }));

    const toggleBrand = (id: string) =>
        setExpandedBrands((prev) => ({ ...prev, [id]: !prev[id] }));

    const expandAll = () => {
        const categoryMap: Record<string, boolean> = {};
        const brandMap: Record<string, boolean> = {};
        hierarchy.forEach((category) => {
            categoryMap[category.id] = true;
            category.brands.forEach((brand) => {
                brandMap[brand.id] = true;
            });
        });
        setExpandedCats(categoryMap);
        setExpandedBrands(brandMap);
    };

    const collapseAll = () => {
        setExpandedCats({});
        setExpandedBrands({});
    };

    return (
        <AdminPageShell
            title="Taxonomy Hierarchy"
            description="Full visual tree: Device Category → Brand → Model. Core dependency of Post Ad wizard, search filters, and fraud detection."
            tabs={<AdminModuleTabs tabs={catalogManagementTabs} />}
            className="h-full overflow-y-auto pr-1"
        >
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { key: "categories" as const, label: "Categories", count: summary.categories },
                        { key: "brands" as const, label: "Brands", count: summary.brands },
                        { key: "models" as const, label: "Models", count: summary.models },
                    ].map(({ key, label, count }) => {
                        const style = summaryCardStyles[key];
                        return (
                            <div
                                key={label}
                                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${style.iconClassName}`}>
                                    {style.icon}
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-slate-900">{loading ? "…" : count}</div>
                                    <div className="text-xs text-slate-500">{label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative flex-1 max-w-xs">
                        <input
                            type="text"
                            placeholder="Search categories…"
                            className="w-full pl-4 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={expandAll}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                            Expand All
                        </button>
                        <button
                            onClick={collapseAll}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                            Collapse All
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                            Loading hierarchy…
                        </div>
                    ) : filteredHierarchy.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                            No categories match your search.
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {filteredHierarchy.map((category) => {
                                const isCategoryExpanded = Boolean(expandedCats[category.id]);
                                return (
                                    <li key={category.id}>
                                        <button
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                                            onClick={() => toggleCategory(category.id)}
                                        >
                                            <span className="text-slate-400 w-4 shrink-0">
                                                {isCategoryExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </span>
                                            <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                                {getListingTypeIcon(category.listingType?.[0] || "", 16)}
                                            </span>
                                            <span className="font-bold text-slate-900 flex-1 text-sm">
                                                {category.name}
                                                <span className="ml-2 text-slate-400 font-normal text-xs">{category.slug}</span>
                                            </span>
                                            {category.hasScreenSizes && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-50 text-blue-600 border border-blue-100">
                                                    Screen Sizes
                                                </span>
                                            )}
                                            <CountBadge count={category.brands.length} label="brands" />
                                            <StatusDot isActive={category.isActive} />
                                        </button>

                                        {isCategoryExpanded && (
                                            <ul className="border-t border-slate-100 bg-slate-50/40">
                                                {category.brands.length === 0 ? (
                                                    <li className="pl-16 pr-4 py-2 text-xs text-slate-400 italic">
                                                        No brands in this category
                                                    </li>
                                                ) : (
                                                    category.brands.map((brand) => {
                                                        const isBrandExpanded = Boolean(expandedBrands[brand.id]);
                                                        return (
                                                            <li key={brand.id} className="border-b border-slate-100 last:border-none">
                                                                <button
                                                                    className="w-full flex items-center gap-3 pl-12 pr-4 py-2.5 hover:bg-white transition-colors text-left"
                                                                    onClick={() => toggleBrand(brand.id)}
                                                                >
                                                                    <span className="text-slate-400 w-4 shrink-0">
                                                                        {isBrandExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                                    </span>
                                                                    <span className="w-7 h-7 rounded-md bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 text-[10px] font-bold">
                                                                        {brand.name.slice(0, 2).toUpperCase()}
                                                                    </span>
                                                                    <span className="text-sm font-semibold text-slate-800 flex-1">
                                                                        {brand.name}
                                                                    </span>
                                                                    <CountBadge count={brand.models.length} label="models" />
                                                                    <StatusDot isActive={brand.isActive} />
                                                                </button>

                                                                {isBrandExpanded && (
                                                                    <ul className="bg-white border-t border-slate-100">
                                                                        {brand.models.length === 0 ? (
                                                                            <li className="pl-28 pr-4 py-2 text-xs text-slate-400 italic">
                                                                                No models for this brand
                                                                            </li>
                                                                        ) : (
                                                                            brand.models.map((model) => (
                                                                                <li
                                                                                    key={model.id}
                                                                                    className="flex items-center gap-3 pl-28 pr-4 py-2 border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors"
                                                                                >
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                                                                                    <span className="text-xs text-slate-700 flex-1">{model.name}</span>
                                                                                    <span
                                                                                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                                                            model.status === "live"
                                                                                                ? "bg-emerald-50 text-emerald-600"
                                                                                                : model.status === "pending"
                                                                                                    ? "bg-amber-50 text-amber-600"
                                                                                                    : "bg-red-50 text-red-600"
                                                                                        }`}
                                                                                    >
                                                                                        {model.status || (model.isActive ? "live" : "inactive")}
                                                                                    </span>
                                                                                </li>
                                                                            ))
                                                                        )}
                                                                    </ul>
                                                                )}
                                                            </li>
                                                        );
                                                    })
                                                )}
                                            </ul>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </AdminPageShell>
    );
}
