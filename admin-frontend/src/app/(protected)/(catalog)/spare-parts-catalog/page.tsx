"use client";

import { useAdminSpareParts } from "@/hooks/useAdminSparePartCatalog";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAssignableCategories } from "@/hooks/useAssignableCategories";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { ISparePartAdmin } from "@/types/sparePartCatalog";
import { useToast } from "@/context/ToastContext";
import {
    Wrench,
    Search,
    Trash2,
    Plus,
    X,
    Edit
} from "lucide-react";
import { useState } from "react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { sparePartsMasterTabs } from "@/components/layout/adminModuleTabSets";
import { catalogManagementTabs } from "@/components/layout/adminModuleTabSets";
import { CatalogModal } from "@/components/catalog/CatalogModal";

export default function SparePartsCatalogPage() {
    const { showToast } = useToast();
    const {
        parts,
        loading,
        error,
        filters,
        setFilters,
        handleDelete,
        handleCreate,
        handleUpdate,
        pagination,
        setPage
    } = useAdminSpareParts();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPart, setEditingPart] = useState<ISparePartAdmin | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        categoryIds: [] as string[],
        listingType: ["postsparepart"] as string[],
        status: "live" as ISparePartAdmin['status']
    });

    const openCreateModal = () => {
        setEditingPart(null);
        setFormData({
            name: "",
            categoryIds: [],
            listingType: ["postsparepart"],
            status: "live"
        });
        setIsModalOpen(true);
    };

    const openEditModal = (part: ISparePartAdmin) => {
        setEditingPart(part);
        setFormData({
            name: part.name,
            categoryIds: part.categoryIds || [],
            listingType: part.listingType || ["postsparepart"],
            status: part.status
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.categoryIds.length === 0) {
            showToast("At least one category is required", "error");
            return;
        }
        const hasInactiveCategory = formData.categoryIds.some((categoryId) => !assignableSpareCategoryIds.has(categoryId));
        if (hasInactiveCategory) {
            showToast("Invalid or inactive categories cannot be assigned. Please uncheck categories marked with errors.", "error");
            return;
        }

        const success = editingPart
            ? await handleUpdate(editingPart.id, formData)
            : await handleCreate(formData);

        if (success) {
            setIsModalOpen(false);
        }
    };

    const toggleCategory = (id: string) => {
        setFormData(prev => ({
            ...prev,
            categoryIds: prev.categoryIds.includes(id)
                ? prev.categoryIds.filter(cid => cid !== id)
                : [...prev.categoryIds, id]
        }));
    };

    const toggleListingType = (type: string) => {
        setFormData(prev => ({
            ...prev,
            listingType: prev.listingType.includes(type)
                ? prev.listingType.filter(t => t !== type)
                : [...prev.listingType, type]
        }));
    };

    const { categories } = useAdminCategories({ initialPagination: { limit: 500 } });
    
    // Bug #7 fix: spare parts belong to categories that explicitly support them.
    const { assignableCategories: assignableSpareCategories, assignableCategoryIdSet: assignableSpareCategoryIds } = useAssignableCategories(
        categories,
        (category) => !!category.listingType?.includes('postsparepart')
    );

    // Categories to display in the modal: Assignable ones + anything already selected (even if invalid)
    const displayCategories = Array.from(new Set([
        ...assignableSpareCategories.map(c => c.id),
        ...formData.categoryIds
    ])).map(id => {
        const cat = categories.find(c => c.id === id);
        const isInvalid = !assignableSpareCategoryIds.has(id);
        let errorHint = "";
        
        if (isInvalid) {
            if (!cat) errorHint = " (Missing)";
            else if (!cat.isActive || cat.status === 'inactive') errorHint = " (Inactive)";
            else if (cat.status === 'rejected') errorHint = " (Rejected)";
            else errorHint = " (Invalid Type)";
        }
        
        return {
            id,
            name: cat?.name || id,
            isInvalid,
            errorHint
        };
    }).sort((a, b) => {
        // Show invalid ones at the top to highlight errors
        if (a.isInvalid && !b.isInvalid) return -1;
        if (!a.isInvalid && b.isInvalid) return 1;
        return (a.name || "").localeCompare(b.name || "");
    });

    const columns: ColumnDef<ISparePartAdmin>[] = [
        {
            header: "Part Name",
            cell: (part) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Wrench size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">{part.name}</div>
                        <div className="text-xs text-slate-500">{part.slug}</div>
                    </div>
                </div>
            )
        },
        {
            header: "Categories",
            cell: (part) => (
                <div className="flex flex-wrap gap-1 max-w-[300px]">
                    {part.categoryIds?.map(catId => {
                        const cat = categories.find(c => c.id === catId);
                        const isInvalid = !assignableSpareCategoryIds.has(catId);
                        return (
                            <span 
                                key={catId} 
                                className={`px-2 py-0.5 rounded text-[10px] border ${
                                    isInvalid 
                                        ? "bg-red-50 text-red-600 border-red-100 font-bold" 
                                        : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                                title={isInvalid ? "This category is inactive or invalid for spare parts" : ""}
                            >
                                {cat?.name || "Unknown"}
                                {isInvalid && " (!)"}
                            </span>
                        );
                    })}
                </div>
            )
        },
        {
            header: "Status",
            cell: (part) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    part.status === 'live' || part.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                    part.status === 'pending' ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                    }`}>
                    {part.status === 'approved' ? 'live' : part.status}
                </span>
            )
        },
        {
            header: "Actions",
            className: "text-right",
            cell: (part) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => openEditModal(part)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        title="Edit"
                    >
                        <Edit size={18} />
                    </button>
                    <button
                        onClick={() => void handleDelete(part.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <AdminPageShell
            title="Spare Parts Master"
            description="Global master list of spare parts — the SSOT for Post Ad Power-Off flow, spare parts marketplace, and repair service linking."
            tabs={<AdminModuleTabs tabs={sparePartsMasterTabs} />}
            actions={
                <button
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    onClick={openCreateModal}
                >
                    <Plus size={18} />
                    Add Master Part
                </button>
            }
            className="h-full overflow-y-auto pr-1"
        >
        <>
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search parts catalog..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                        value={filters.categoryId}
                        onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    >
                        <option value="all">All Status</option>
                        <option value="live">Live</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                    {error}
                </div>
            )}

            <DataTable
                data={parts}
                columns={columns}
                isLoading={loading}
                emptyMessage="No catalog parts found"
                enableColumnVisibility
                enableCsvExport
                csvFileName="spare-parts-catalog.csv"
                pagination={{
                    currentPage: pagination.page,
                    totalPages: pagination.totalPages || 1,
                    totalItems: pagination.total,
                    pageSize: pagination.limit,
                    onPageChange: setPage
                }}
            />

            <CatalogModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPart ? "Edit Master Part" : "Add New Master Part"}
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Part Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    placeholder="e.g. Battery"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Associated Categories
                                </label>
                                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
                                    {displayCategories.map(cat => (
                                        <label 
                                            key={cat.id} 
                                            className={`flex items-center gap-3 cursor-pointer group p-2 rounded-md transition-all ${
                                                cat.isInvalid ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-white"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className={`w-4 h-4 rounded focus:ring-primary/20 ${
                                                    cat.isInvalid ? "text-red-500 border-red-300" : "text-primary border-slate-300"
                                                }`}
                                                checked={formData.categoryIds.includes(cat.id || "")}
                                                onChange={() => toggleCategory(cat.id || "")}
                                            />
                                            <span className={`text-sm font-medium transition-colors ${
                                                cat.isInvalid 
                                                    ? "text-red-700 font-bold" 
                                                    : "text-slate-700 group-hover:text-primary"
                                            }`}>
                                                {cat.name} 
                                                <span className="text-[10px] opacity-70 ml-1">
                                                    {cat.errorHint}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                    {displayCategories.length === 0 && (
                                         <div className="text-xs text-slate-400 italic">No categories available</div>
                                    )}
                                </div>
                                {formData.categoryIds.some(id => !assignableSpareCategoryIds.has(id)) && (
                                    <p className="text-[10px] text-red-600 font-bold animate-pulse">
                                        * Please uncheck red-highlighted categories to save changes.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Placement (Workflows)
                                </label>
                                <div className="flex gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    {[
                                        { id: 'postad', label: 'Post Ad (Feature)' },
                                        { id: 'postsparepart', label: 'Inventory (Secondary)' }
                                    ].map(type => (
                                        <label key={type.id} className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary/20"
                                                checked={formData.listingType.includes(type.id)}
                                                onChange={() => toggleListingType(type.id)}
                                            />
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">
                                                {type.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {formData.listingType.length === 0 && (
                                    <p className="text-[10px] text-amber-600 font-bold italic">
                                        * No placement selected will hide this part from all workflows.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Approval Status
                                </label>
                                <select
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                                >
                                    <option value="live">Live</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-lg font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                >
                                    {loading ? "Saving..." : editingPart ? "Update Part" : "Create Part"}
                                </button>
                            </div>
                        </form>
            </CatalogModal>
        </div>
        </>
        </AdminPageShell>
    );
}
