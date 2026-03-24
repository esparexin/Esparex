"use client";

import { useState } from "react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminScreenSizes } from "@/hooks/useAdminScreenSizes";
import { useToast } from "@/context/ToastContext";
import { ScreenSize } from "@/types/screenSize";
import { useAssignableCategories } from "@/hooks/useAssignableCategories";
import { Monitor, Search, Filter, Trash2, Plus, Edit, X } from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { catalogManagementTabs } from "@/components/layout/adminModuleTabSets";
import { CatalogModal } from "@/components/catalog/CatalogModal";

type ScreenSizeFormData = {
    size: string;
    name: string;
    value: number;
    categoryId: string;
    isActive: boolean;
};

export default function ScreenSizesPage() {
    const { showToast } = useToast();
    const { categories } = useAdminCategories();
    const {
        screenSizes,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        handleDelete,
        handleCreate,
        handleUpdate,
    } = useAdminScreenSizes();

    // Refactored to use shared assignable categories hook
    const { assignableCategories, assignableCategoryIdSet: assignableCatIds } = useAssignableCategories(
        categories,
        (cat) => cat.hasScreenSizes === true
    );

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingScreenSize, setEditingScreenSize] = useState<ScreenSize | null>(null);
    const [formData, setFormData] = useState<ScreenSizeFormData>({
        size: "",
        name: "",
        value: 1,
        categoryId: "",
        isActive: true,
    });

    const openCreateModal = () => {
        setEditingScreenSize(null);
        setFormData({ size: "", name: "", value: 1, categoryId: "", isActive: true });
        setIsModalOpen(true);
    };

    const openEditModal = (screenSize: ScreenSize) => {
        setEditingScreenSize(screenSize);
        setFormData({
            size: screenSize.size,
            name: screenSize.name,
            value: screenSize.value,
            categoryId: screenSize.categoryId,
            isActive: screenSize.isActive,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.categoryId) {
            showToast("Category is required", "error");
            return;
        }
        if (!assignableCatIds.has(formData.categoryId)) {
            showToast("Inactive category cannot be assigned to screen size", "error");
            return;
        }
        const payload = {
            size: formData.size.trim(),
            ...(formData.name.trim() ? { name: formData.name.trim() } : {}),
            value: Number(formData.value),
            categoryId: formData.categoryId,
            isActive: formData.isActive,
        };
        const success = editingScreenSize
            ? await handleUpdate(editingScreenSize.id, payload)
            : await handleCreate(payload);
        if (success) setIsModalOpen(false);
    };

    const columns: ColumnDef<ScreenSize>[] = [
        {
            header: "Screen Size",
            cell: (screenSize) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                        <Monitor size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">{screenSize.size}</div>
                        <div className="text-xs text-slate-500">{screenSize.name}</div>
                    </div>
                </div>
            ),
        },
        {
            header: "Category",
            cell: (screenSize) => {
                const category = categories.find((cat) => cat.id === screenSize.categoryId);
                return <span className="text-sm font-medium text-slate-700">{category?.name || "Unknown"}</span>;
            },
        },
        {
            header: "Sort Order",
            cell: (screenSize) => <span className="text-sm font-semibold text-slate-700">{screenSize.value}</span>,
        },
        {
            header: "Status",
            cell: (screenSize) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${screenSize.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {screenSize.isActive ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            header: "Actions",
            className: "text-right",
            cell: (screenSize) => (
                <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEditModal(screenSize)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Edit">
                        <Edit size={18} />
                    </button>
                    <button onClick={() => void handleDelete(screenSize.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <AdminPageShell
            title="Screen Sizes"
            description="Manage screen-size master data by category."
            tabs={<AdminModuleTabs tabs={catalogManagementTabs} />}
            actions={
                <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all" onClick={openCreateModal}>
                    <Plus size={18} />
                    Add Screen Size
                </button>
            }
            className="h-full overflow-y-auto pr-1"
        >
            <>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search screen sizes..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                value={filters.search}
                                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="text-slate-400" size={16} />
                            <select
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                                value={filters.categoryId}
                                onChange={(e) => setFilters((prev) => ({ ...prev, categoryId: e.target.value }))}
                            >
                                <option value="all">All Categories</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">{error}</div>
                    )}

                    <DataTable
                        data={screenSizes}
                        columns={columns}
                        isLoading={loading}
                        emptyMessage="No screen sizes found"
                        enableColumnVisibility
                        enableCsvExport
                        csvFileName="screen-sizes.csv"
                        pagination={{
                            currentPage: pagination.page,
                            totalPages: pagination.totalPages || 1,
                            totalItems: pagination.total,
                            pageSize: pagination.limit,
                            onPageChange: setPage,
                        }}
                    />
                </div>
                <CatalogModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingScreenSize ? "Edit Screen Size" : "Add New Screen Size"}
                >
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Size</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    placeholder='e.g. 55"'
                                    value={formData.size}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort Order</label>
                                <input
                                    required
                                    type="number"
                                    min={1}
                                    title="Numeric sort order — lower numbers appear first"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    value={formData.value}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, value: Number(e.target.value) }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Display Name (Optional)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                placeholder='e.g. 55" TV'
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                            <select
                                required
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={formData.categoryId}
                                onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                            >
                                <option value="">Select Category</option>
                                {assignableCategories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </div>

                        <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer group hover:bg-white hover:border-primary/50 transition-all">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                                checked={formData.isActive}
                                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                            />
                            <span className="text-sm font-semibold text-slate-700">Active</span>
                        </label>

                        <div className="pt-4 flex gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100">
                                {loading ? "Saving..." : editingScreenSize ? "Update Screen Size" : "Create Screen Size"}
                            </button>
                        </div>
                    </form>
                </CatalogModal>
            </>
        </AdminPageShell>
    );
}
