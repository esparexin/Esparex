"use client";

import { useAdminBrands } from "@/hooks/useAdminBrands";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Brand } from "@/types/brand";
import { useToast } from "@/context/ToastContext";
import { useAssignableCategories } from "@/hooks/useAssignableCategories";
import {
    Tag,
    Search,
    Filter,
    Trash2,
    Plus,
    Edit,
    CheckCircle,
    XCircle
} from "lucide-react";
import { useState } from "react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { catalogManagementTabs } from "@/components/layout/adminModuleTabSets";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { adminBrandSchema } from "@/schemas/admin.schemas";

export default function BrandsPage() {
    const { showToast } = useToast();
    const {
        brands,
        loading,
        error,
        filters,
        setFilters,
        handleDelete,
        handleCreate,
        handleUpdate,
        pagination,
        setPage,
        handleToggleStatus,
        handleApprove,
        handleReject
    } = useAdminBrands();

    // Single source of categories — used for table display and modal assignment
    const { categories } = useAdminCategories();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [archivedCategoryCount, setArchivedCategoryCount] = useState(0);
    const [formData, setFormData] = useState({
        name: "",
        categoryIds: [] as string[],
        isActive: true
    });

    // Single source of active categories for assignment/editing
    const { assignableCategories, assignableCategoryIdSet } = useAssignableCategories(categories);

    const getBrandCategoryIds = (brand: Brand) => (
        brand.categoryIds?.length
            ? brand.categoryIds
            : (brand.categoryId ? [brand.categoryId] : [])
    );

    const closeModal = () => {
        setIsModalOpen(false);
        setArchivedCategoryCount(0);
    };

    const openCreateModal = () => {
        setEditingBrand(null);
        setArchivedCategoryCount(0);
        setFormData({
            name: "",
            categoryIds: [],
            isActive: true
        });
        setIsModalOpen(true);
    };

    const openEditModal = (brand: Brand) => {
        const categoryIds = Array.from(new Set(getBrandCategoryIds(brand)));
        const activeCategoryIds = categoryIds.filter((id) => assignableCategoryIdSet.has(id));
        const archivedCount = categoryIds.length - activeCategoryIds.length;

        setEditingBrand(brand);
        setArchivedCategoryCount(archivedCount);
        setFormData({
            name: brand.name,
            categoryIds: activeCategoryIds,
            isActive: brand.isActive
        });
        setIsModalOpen(true);
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Pre-submit validation guard
        const validation = adminBrandSchema.safeParse(formData);
        if (!validation.success) {
            showToast(validation.error.issues[0]?.message || "Invalid brand data", "error");
            return;
        }

        const success = editingBrand
            ? await handleUpdate(editingBrand.id, formData)
            : await handleCreate(formData);

        if (success) {
            closeModal();
        }
    };

    const columns: ColumnDef<Brand>[] = [
        {
            header: "Brand",
            cell: (brand) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                        <Tag size={20} />
                    </div>
                    <div className="font-bold text-slate-900">{brand.name}</div>
                </div>
            )
        },
        {
            header: "Categories",
            cell: (brand) => {
                const brandCats = getBrandCategoryIds(brand);
                return (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {brandCats.map(cid => {
                            const cat = categories.find(c => c.id === cid);
                            return (
                                <span key={cid} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                                    {cat?.name || "Archived"}
                                </span>
                            );
                        })}
                        {brandCats.length === 0 && (
                            <span className="text-[10px] text-red-500 font-medium italic">No Category</span>
                        )}
                    </div>
                );
            }
        },
        {
            header: "Status",
            cell: (brand) => {
                if (brand.isDeleted) {
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                            Deleted
                        </span>
                    );
                }

                return (
                    <button
                        onClick={() => void handleToggleStatus(brand.id)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${brand.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}>
                        {brand.isActive ? "Active" : "Inactive"}
                    </button>
                );
            }
        },
        {
            header: "Actions",
            className: "text-right",
            cell: (brand) => {
                if (brand.isDeleted) {
                    return (
                        <div className="text-xs font-medium text-slate-400">
                            Hidden record
                        </div>
                    );
                }

                return (
                    <div className="flex items-center justify-end gap-2">
                        {brand.status === 'pending' && (
                            <>
                                <button
                                    onClick={() => void handleApprove(brand.id)}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                    title="Approve"
                                >
                                    <CheckCircle size={18} />
                                </button>
                                <button
                                    onClick={() => {
                                        const reason = prompt("Reason for rejection:");
                                        if (reason) void handleReject(brand.id, reason);
                                    }}
                                    className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                    title="Reject"
                                >
                                    <XCircle size={18} />
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => openEditModal(brand)}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            title="Edit"
                        >
                            <Edit size={18} />
                        </button>
                        <button
                            onClick={() => void handleDelete(brand.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <AdminPageShell
            title="Brand Management"
            description="Manage product brands and their category assignments."
            tabs={<AdminModuleTabs tabs={catalogManagementTabs} />}
            actions={
                <button
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    onClick={openCreateModal}
                >
                    <Plus size={18} />
                    Add Brand
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
                        placeholder="Search brands..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-slate-400" size={16} />
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
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="all">All Status</option>
                        <option value="live">Live Only</option>
                        <option value="inactive">Inactive Only</option>
                        <option value="pending">Pending Only</option>
                        <option value="rejected">Rejected Only</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                    {error}
                </div>
            )}

            <DataTable
                data={brands}
                columns={columns}
                isLoading={loading}
                emptyMessage="No brands found"
                enableColumnVisibility
                enableCsvExport
                csvFileName="brands.csv"
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
                onClose={closeModal}
                title={editingBrand ? "Edit Brand" : "Add New Brand"}
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Brand Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    placeholder="e.g. Samsung"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Assigned Categories
                                </label>
                                {archivedCategoryCount > 0 && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                        {archivedCategoryCount} archived category link{archivedCategoryCount === 1 ? "" : "s"} {archivedCategoryCount === 1 ? "was" : "were"} removed from this editor.
                                        Select active categories and save to clean up the brand.
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    {assignableCategories.map(cat => (
                                        <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                                                checked={formData.categoryIds.includes(cat.id || "")}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    const catId = cat.id;
                                                    if (!catId) return;
                                                    
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        categoryIds: checked 
                                                            ? [...prev.categoryIds, catId]
                                                            : prev.categoryIds.filter(id => id !== catId)
                                                    }));
                                                }}
                                            />
                                            <span className="text-sm text-slate-700 group-hover:text-primary transition-colors">{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer group hover:bg-white hover:border-primary/50 transition-all">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                />
                                <span className="text-sm font-semibold text-slate-700">Active Status</span>
                            </label>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2.5 rounded-lg font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                >
                                    {loading ? "Saving..." : editingBrand ? "Update Brand" : "Create Brand"}
                                </button>
                            </div>
                        </form>
            </CatalogModal>
        </div>
        </>
        </AdminPageShell>
    );
}
