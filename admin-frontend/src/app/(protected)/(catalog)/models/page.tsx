"use client";

import { useAdminModels } from "@/hooks/useAdminModels";
import { useAdminBrands } from "@/hooks/useAdminBrands";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Model } from "@/types/model";
import { useToast } from "@/context/ToastContext";
import {
    Layers,
    Search,
    Trash2,
    Plus,
    X,
    Edit
} from "lucide-react";
import { useState } from "react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { catalogManagementTabs } from "@/components/layout/adminModuleTabSets";
import { adminModelSchema } from "@/schemas/admin.schemas";
import { useAssignableCategories } from "@/hooks/useAssignableCategories";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { normalizeObjectIdLike } from "@/lib/utils/idUtils";

export default function ModelsPage() {
    const { showToast } = useToast();
    const {
        models,
        loading,
        error,
        filters,
        setFilters,
        handleDelete,
        handleCreate,
        handleUpdate,
        pagination,
        setPage
    } = useAdminModels();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<Model | null>(null);
    const [archivedCategoryCount, setArchivedCategoryCount] = useState(0);
    const [formData, setFormData] = useState({
        name: "",
        brandId: "",
        categoryIds: [] as string[],
        status: "live" as Model['status']
    });

    const getModelCategoryIds = (model: Model) => (
        model.categoryIds?.length
            ? model.categoryIds
            : (model.categoryId ? [model.categoryId] : [])
    );

    const openCreateModal = () => {
        setEditingModel(null);
        setArchivedCategoryCount(0);
        setFormData({
            name: "",
            brandId: "",
            categoryIds: [],
            status: "live"
        });
        setIsModalOpen(true);
    };

    const openEditModal = (model: Model) => {
        const categoryIds = Array.from(new Set(getModelCategoryIds(model)));
        const activeCategoryIds = categoryIds.filter((id) => assignableCategoryIdSet.has(id));
        const archivedCount = categoryIds.length - activeCategoryIds.length;

        setEditingModel(model);
        setArchivedCategoryCount(archivedCount);
        setFormData({
            name: model.name,
            brandId: normalizeObjectIdLike(model.brandId),
            categoryIds: activeCategoryIds,
            status: model.status
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Pre-submit validation guard
        const validation = adminModelSchema.safeParse(formData);
        if (!validation.success) {
            showToast(validation.error.issues[0]?.message || "Invalid model data", "error");
            return;
        }

        if (formData.categoryIds.length === 0) {
            showToast("At least one category is required", "error");
            return;
        }

        const selectedBrand = brands.find((brand) => brand.id === formData.brandId);
        if (selectedBrand) {
            const brandCats = selectedBrand.categoryIds?.length ? selectedBrand.categoryIds : (selectedBrand.categoryId ? [selectedBrand.categoryId] : []);
            const hasCommonCategory = formData.categoryIds.some(cid => brandCats.includes(cid));
            if (!hasCommonCategory) {
                showToast("Selected brand is not mapped to any of the selected categories", "error");
                // Allow proceeding but warn? No, strict validation is safer.
                return;
            }
        }

        const success = editingModel
            ? await handleUpdate(editingModel.id, formData)
            : await handleCreate(formData);

        if (success) {
            setIsModalOpen(false);
        }
    };

    const { brands } = useAdminBrands();
    const { categories } = useAdminCategories();
    const { assignableCategories, assignableCategoryIdSet } = useAssignableCategories(categories);

    const formBrands = formData.categoryIds.length > 0
        ? brands.filter((brand) => {
            const brandCats = brand.categoryIds?.length ? brand.categoryIds : (brand.categoryId ? [brand.categoryId] : []);
            return brandCats.some(cid => formData.categoryIds.includes(cid));
        })
        : brands;

    const columns: ColumnDef<Model>[] = [
        {
            header: "Model",
            cell: (model) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Layers size={20} />
                    </div>
                    <div className="font-bold text-slate-900">{model.name}</div>
                </div>
            )
        },
        {
            header: "Brand / Categories",
            cell: (model) => {
                const brand = brands.find(b => b.id === normalizeObjectIdLike(model.brandId));
                const modelCats = getModelCategoryIds(model);
                return (
                    <div className="text-xs space-y-1.5">
                        <div className="text-slate-900 font-bold">{brand?.name || "Unknown Brand"}</div>
                        <div className="flex flex-wrap gap-1">
                            {modelCats.map(cid => {
                                const cat = categories.find(c => c.id === cid);
                                return (
                                    <span key={cid} className="px-1.5 py-0.5 rounded-[4px] bg-slate-100 text-[9px] text-slate-500 font-medium">
                                        {cat?.name || "Archived"}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                );
            }
        },
        {
            header: "Status",
            cell: (model) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${model.status === 'live' ? "bg-emerald-100 text-emerald-700" :
                    model.status === 'pending' ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                    }`}>
                    {model.status}
                </span>
            )
        },
        {
            header: "Actions",
            className: "text-right",
            cell: (model) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => openEditModal(model)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        title="Edit"
                    >
                        <Edit size={18} />
                    </button>
                    <button
                        onClick={() => void handleDelete(model.id)}
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
            title="Model Management"
            description="Manage product models and their brand and category mappings."
            tabs={<AdminModuleTabs tabs={catalogManagementTabs} />}
            actions={
                <button
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    onClick={openCreateModal}
                >
                    <Plus size={18} />
                    Add Model
                </button>
            }
            className="h-full overflow-y-auto pr-1"
        >
        <>
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search models..."
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
                        value={filters.brandId}
                        onChange={(e) => setFilters(prev => ({ ...prev, brandId: e.target.value }))}
                    >
                        <option value="all">All Brands</option>
                        {brands.map(brand => (
                            <option key={brand.id} value={brand.id}>{brand.name}</option>
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
                data={models}
                columns={columns}
                isLoading={loading}
                emptyMessage="No models found"
                enableColumnVisibility
                enableCsvExport
                csvFileName="models.csv"
                pagination={{
                    currentPage: pagination.page,
                    totalPages: pagination.totalPages || 1,
                    totalItems: pagination.total,
                    pageSize: pagination.limit,
                    onPageChange: setPage
                }}
            />

            {/* Model Modal */}
            <CatalogModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingModel ? "Edit Model" : "Add New Model"}
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Model Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    placeholder="e.g. iPhone 15 Pro"
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Brand
                                    </label>
                                    <select
                                        required
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        value={formData.brandId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, brandId: e.target.value }))}
                                    >
                                        <option value="">Select Brand</option>
                                        {brands.map(brand => (
                                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Status
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
                                    {loading ? "Saving..." : editingModel ? "Update Model" : "Create Model"}
                                </button>
                            </div>
                        </form>
            </CatalogModal>
        </div>
        </>
        </AdminPageShell>
    );
}
