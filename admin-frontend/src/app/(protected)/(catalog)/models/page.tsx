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
    const [formData, setFormData] = useState({
        name: "",
        brandId: "",
        categoryId: "",
        status: "live" as Model['status']
    });

    const normalizeObjectIdLike = (value: unknown): string => {
        if (typeof value === "string") return value;
        if (value && typeof value === "object") {
            const record = value as { id?: string; _id?: string };
            return record.id || record._id || "";
        }
        return "";
    };

    const openCreateModal = () => {
        setEditingModel(null);
        setFormData({
            name: "",
            brandId: "",
            categoryId: "",
            status: "live"
        });
        setIsModalOpen(true);
    };

    const openEditModal = (model: Model) => {
        setEditingModel(model);
        setFormData({
            name: model.name,
            brandId: normalizeObjectIdLike(model.brandId),
            categoryId: normalizeObjectIdLike(model.categoryId),
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

        if (!assignableCategoryIds.has(formData.categoryId)) {
            showToast("Inactive category cannot be assigned to model", "error");
            return;
        }
        const selectedBrand = brands.find((brand) => brand.id === formData.brandId);
        if (selectedBrand && selectedBrand.categoryId !== formData.categoryId) {
            showToast("Selected brand is not mapped to selected category", "error");
            return;
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
    const assignableCategories = categories.filter((category) =>
        category.isActive && category.status !== "inactive" && category.status !== "rejected"
    );
    const assignableCategoryIds = new Set(assignableCategories.map((category) => category.id));
    const formBrands = formData.categoryId
        ? brands.filter((brand) => !brand.categoryId || brand.categoryId === formData.categoryId)
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
            header: "Brand / Category",
            cell: (model) => {
                const brand = brands.find(b => b.id === normalizeObjectIdLike(model.brandId));
                const cat = categories.find(c => c.id === normalizeObjectIdLike(model.categoryId));
                return (
                    <div className="text-xs space-y-1">
                        <div className="text-slate-900 font-semibold">{brand?.name || "Unknown Brand"}</div>
                        <div className="text-slate-500">{cat?.name || "Unknown Category"}</div>
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
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingModel ? "Edit Model" : "Add New Model"}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Category
                                    </label>
                                    <select
                                        required
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        value={formData.categoryId}
                                        onChange={(e) =>
                                            setFormData(prev => {
                                                const nextCategoryId = e.target.value;
                                                const currentBrand = brands.find((brand) => brand.id === prev.brandId);
                                                const brandMatchesCategory = Boolean(
                                                    !currentBrand?.categoryId || currentBrand.categoryId === nextCategoryId
                                                );
                                                return {
                                                    ...prev,
                                                    categoryId: nextCategoryId,
                                                    brandId: brandMatchesCategory ? prev.brandId : ""
                                                };
                                            })
                                        }
                                    >
                                        <option value="">Select Category</option>
                                        {assignableCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

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
                                        {formBrands.map(brand => (
                                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                                        ))}
                                    </select>
                                </div>
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
                    </div>
                </div>
            )}
        </div>
        </>
        </AdminPageShell>
    );
}
