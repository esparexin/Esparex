"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { catalogManagementTabs } from "@/components/layout/adminModuleTabSets";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { getBrands } from "@/lib/api/brands";
import { getModels } from "@/lib/api/models";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { Category } from "@/types/category";
import { Brand } from "@/types/brand";
import { Model } from "@/types/model";
import {
    ChevronRight,
    ChevronDown,
    Smartphone,
    Wrench,
    Briefcase,
    Box,
    CheckCircle,
    XCircle,
    AlertCircle,
    Layers,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModelNode {
    model: Model;
}

interface BrandNode {
    brand: Brand;
    models: ModelNode[];
    modelsExpanded: boolean;
}

interface CategoryNode {
    category: Category;
    brands: BrandNode[];
    expanded: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCategoryIcon = (listingType: string[] = []) => {
    if (listingType.includes('postad')) return <Smartphone size={16} />;
    if (listingType.includes('postservice')) return <Briefcase size={16} />;
    if (listingType.includes('postsparepart')) return <Wrench size={16} />;
    return <Box size={16} />;
};

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaxonomyHierarchyPage() {
    const { categories, loading: catsLoading } = useAdminCategories({
        initialPagination: { limit: 500 },
    });

    const [allBrands,  setAllBrands]  = useState<Brand[]>([]);
    const [allModels,  setAllModels]  = useState<Model[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataError,   setDataError]   = useState<string | null>(null);

    // Collapse/expand state stored as a map: categoryId → expanded
    const [expandedCats,   setExpandedCats]   = useState<Record<string, boolean>>({});
    const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});

    // Search
    const [search, setSearch] = useState("");

    useEffect(() => {
        setDataLoading(true);
        Promise.all([
            getBrands({ limit: "500", page: "1" }),
            getModels({ limit: "500", page: "1" }),
        ])
            .then(([brandsRes, modelsRes]) => {
                if (brandsRes.success) {
                    setAllBrands(parseAdminResponse<Brand>(brandsRes).items);
                }
                if (modelsRes.success) {
                    setAllModels(parseAdminResponse<Model>(modelsRes).items);
                }
                if (!brandsRes.success || !modelsRes.success) {
                    setDataError("Failed to load brands or models");
                }
            })
            .catch(() => setDataError("Network error loading hierarchy"))
            .finally(() => setDataLoading(false));
    }, []);

    // ── Build tree ─────────────────────────────────────────────────────────────

    const tree: CategoryNode[] = categories
        .filter((cat) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                cat.name.toLowerCase().includes(q) ||
                cat.slug.toLowerCase().includes(q)
            );
        })
        .map((cat): CategoryNode => {
            const catBrands = allBrands.filter((b) => 
                b.categoryId === cat.id || 
                b.categoryIds?.includes(cat.id)
            );
            return {
                category: cat,
                expanded: !!expandedCats[cat.id],
                brands: catBrands.map((brand): BrandNode => ({
                    brand,
                    modelsExpanded: !!expandedBrands[brand.id],
                    models: allModels
                        .filter((m) => 
                            m.brandId === brand.id && 
                            (m.categoryId === cat.id || m.categoryIds?.includes(cat.id))
                        )
                        .map((model) => ({ model })),
                })),
            };
        });

    const isLoading = catsLoading || dataLoading;
    const totalBrands = allBrands.length;
    const totalModels = allModels.length;

    // ── Toggle helpers ────────────────────────────────────────────────────────

    const toggleCategory = (id: string) =>
        setExpandedCats((prev) => ({ ...prev, [id]: !prev[id] }));

    const toggleBrand = (id: string) =>
        setExpandedBrands((prev) => ({ ...prev, [id]: !prev[id] }));

    const expandAll = () => {
        const cats: Record<string, boolean> = {};
        const brands: Record<string, boolean> = {};
        categories.forEach((c) => { cats[c.id] = true; });
        allBrands.forEach((b) => { brands[b.id] = true; });
        setExpandedCats(cats);
        setExpandedBrands(brands);
    };

    const collapseAll = () => {
        setExpandedCats({});
        setExpandedBrands({});
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AdminPageShell
            title="Taxonomy Hierarchy"
            description="Full visual tree: Device Category → Brand → Model. Core dependency of Post Ad wizard, search filters, and fraud detection."
            tabs={<AdminModuleTabs tabs={catalogManagementTabs} />}
            className="h-full overflow-y-auto pr-1"
        >
            <div className="space-y-4">
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Categories", count: categories.length, icon: <Layers size={18} />, color: "indigo" },
                        { label: "Brands",     count: totalBrands,        icon: <Smartphone size={18} />, color: "sky" },
                        { label: "Models",     count: totalModels,        icon: <Box size={18} />,        color: "violet" },
                    ].map(({ label, count, icon, color }) => (
                        <div
                            key={label}
                            className={`flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm`}
                        >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${color}-50 text-${color}-600`}>
                                {icon}
                            </div>
                            <div>
                                <div className="text-xl font-bold text-slate-900">{isLoading ? "…" : count}</div>
                                <div className="text-xs text-slate-500">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative flex-1 max-w-xs">
                        <input
                            type="text"
                            placeholder="Search categories…"
                            className="w-full pl-4 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
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

                {/* Error */}
                {dataError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        <AlertCircle size={16} />
                        {dataError}
                    </div>
                )}

                {/* Tree */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                            Loading hierarchy…
                        </div>
                    ) : tree.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                            No categories match your search.
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {tree.map((node) => (
                                <li key={node.category.id}>
                                    {/* ── Category row ── */}
                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                                        onClick={() => toggleCategory(node.category.id)}
                                    >
                                        <span className="text-slate-400 w-4 shrink-0">
                                            {node.expanded
                                                ? <ChevronDown size={16} />
                                                : <ChevronRight size={16} />}
                                        </span>
                                        <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                            {getCategoryIcon(node.category.listingType)}
                                        </span>
                                        <span className="font-bold text-slate-900 flex-1 text-sm">
                                            {node.category.name}
                                            <span className="ml-2 text-slate-400 font-normal text-xs">{node.category.slug}</span>
                                        </span>
                                        {node.category.hasScreenSizes && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-50 text-blue-600 border border-blue-100">
                                                Screen Sizes
                                            </span>
                                        )}
                                        <CountBadge count={node.brands.length} label="brands" />
                                        <StatusDot isActive={node.category.isActive} />
                                    </button>

                                    {/* ── Brands (expanded) ── */}
                                    {node.expanded && (
                                        <ul className="border-t border-slate-100 bg-slate-50/40">
                                            {node.brands.length === 0 ? (
                                                <li className="pl-16 pr-4 py-2 text-xs text-slate-400 italic">
                                                    No brands in this category
                                                </li>
                                            ) : (
                                                node.brands.map((bNode) => (
                                                    <li key={bNode.brand.id} className="border-b border-slate-100 last:border-none">
                                                        {/* Brand row */}
                                                        <button
                                                            className="w-full flex items-center gap-3 pl-12 pr-4 py-2.5 hover:bg-white transition-colors text-left"
                                                            onClick={() => toggleBrand(bNode.brand.id)}
                                                        >
                                                            <span className="text-slate-400 w-4 shrink-0">
                                                                {bNode.modelsExpanded
                                                                    ? <ChevronDown size={14} />
                                                                    : <ChevronRight size={14} />}
                                                            </span>
                                                            <span className="w-7 h-7 rounded-md bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 text-[10px] font-bold">
                                                                {bNode.brand.name.slice(0, 2).toUpperCase()}
                                                            </span>
                                                            <span className="text-sm font-semibold text-slate-800 flex-1">
                                                                {bNode.brand.name}
                                                            </span>
                                                            <CountBadge count={bNode.models.length} label="models" />
                                                            <StatusDot isActive={bNode.brand.isActive} />
                                                        </button>

                                                        {/* Models (expanded) */}
                                                        {bNode.modelsExpanded && (
                                                            <ul className="bg-white border-t border-slate-100">
                                                                {bNode.models.length === 0 ? (
                                                                    <li className="pl-28 pr-4 py-2 text-xs text-slate-400 italic">
                                                                        No models for this brand
                                                                    </li>
                                                                ) : (
                                                                    bNode.models.map(({ model }) => (
                                                                        <li
                                                                            key={model.id}
                                                                            className="flex items-center gap-3 pl-28 pr-4 py-2 border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors"
                                                                        >
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                                                                            <span className="text-xs text-slate-700 flex-1">{model.name}</span>
                                                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                                                model.status === "live"  ? "bg-emerald-50 text-emerald-600" :
                                                                                model.status === "pending" ? "bg-amber-50 text-amber-600" :
                                                                                                             "bg-red-50 text-red-600"
                                                                            }`}>
                                                                                {model.status}
                                                                            </span>
                                                                        </li>
                                                                    ))
                                                                )}
                                                            </ul>
                                                        )}
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-slate-500 px-1">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle size={12} className="text-emerald-500" />
                        Active
                    </div>
                    <div className="flex items-center gap-1.5">
                        <XCircle size={12} className="text-slate-400" />
                        Inactive
                    </div>
                    <span className="text-slate-300">·</span>
                    <span>Click a row to expand / collapse</span>
                </div>
            </div>
        </AdminPageShell>
    );
}
