"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { catalogManagementTabs } from "@/components/layout/adminModuleTabSets";
import { getCatalogHierarchyTree, type HierarchyTreeCategoryNode } from "@/lib/api/catalogGovernance";
import {
    Smartphone,
    Box,
    AlertCircle,
    Layers,
} from "lucide-react";
import { CategoryTreeRow } from "./CategoryTreeRow";



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
                            {filteredHierarchy.map((category) => (
                                <CategoryTreeRow
                                    key={category.id}
                                    category={category}
                                    isExpanded={Boolean(expandedCats[category.id])}
                                    expandedBrands={expandedBrands}
                                    onToggleCategory={() => toggleCategory(category.id)}
                                    onToggleBrand={toggleBrand}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </AdminPageShell>
    );
}
