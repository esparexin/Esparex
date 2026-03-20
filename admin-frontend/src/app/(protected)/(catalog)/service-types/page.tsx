"use client";

import { useState } from "react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAssignableCategories } from "@/hooks/useAssignableCategories";
import { useAdminServiceTypes, ServiceType } from "@/hooks/useAdminServiceTypes";
import { useToast } from "@/context/ToastContext";
import { Wrench, Search, Trash2, Plus, Edit, X, ToggleLeft } from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { catalogManagementTabs } from "@/components/layout/adminModuleTabSets";
import { CatalogModal } from "@/components/catalog/CatalogModal";

type ServiceTypeFormData = {
    name: string;
    categoryIds: string[];
    isActive: boolean;
};

export default function ServiceTypesPage() {
    const { showToast } = useToast();
    const { categories } = useAdminCategories();
    const {
        serviceTypes,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        handleToggleStatus,
        handleDelete,
        handleCreate,
        handleUpdate,
    } = useAdminServiceTypes();

    const { assignableCategories } = useAssignableCategories(categories, (cat) => !!cat.listingType?.includes('postservice'));

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null);
    const [formData, setFormData] = useState<ServiceTypeFormData>({
        name: "",
        categoryIds: [],
        isActive: true,
    });

    const openCreateModal = () => {
        setEditingServiceType(null);
        setFormData({ name: "", categoryIds: [], isActive: true });
        setIsModalOpen(true);
    };

    const openEditModal = (serviceType: ServiceType) => {
        setEditingServiceType(serviceType);
        setFormData({
            name: serviceType.name,
            categoryIds: serviceType.categoryIds || [],
            isActive: serviceType.isActive,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.categoryIds.length === 0) {
            showToast("At least one category is required", "error");
            return;
        }

        const payload: Record<string, unknown> = {
            name: formData.name.trim(),
            categoryIds: formData.categoryIds,
            isActive: formData.isActive,
        };

        const success = editingServiceType
            ? await handleUpdate(editingServiceType.id, payload)
            : await handleCreate(payload);

        if (success) setIsModalOpen(false);
    };

    const columns: ColumnDef<ServiceType>[] = [
        {
            header: "Service Type",
            cell: (st) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Wrench size={20} />
                    </div>
                    <div className="font-bold text-slate-900">{st.name}</div>
                </div>
            ),
        },
        {
            header: "Categories",
            cell: (st) => {
                const stCats = st.categoryIds || [];
                return (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {stCats.map(cid => {
                            const cat = categories.find(c => c.id === cid);
                            return (
                                <span key={cid} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                                    {cat?.name || "Unknown"}
                                </span>
                            );
                        })}
                        {stCats.length === 0 && (
                            <span className="text-sm text-slate-400 font-medium italic">All Categories</span>
                        )}
                    </div>
                );
            },
        },
        {
            header: "Status",
            cell: (st) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${st.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {st.isActive ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            header: "Actions",
            className: "text-right",
            cell: (st) => (
                <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEditModal(st)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Edit">
                        <Edit size={18} />
                    </button>
                    <button onClick={() => void handleToggleStatus(st)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title={st.isActive ? "Deactivate" : "Activate"}>
                        <ToggleLeft size={18} />
                    </button>
                    <button onClick={() => void handleDelete(st.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <AdminPageShell
            title="Service Types"
            description="Manage service type master data used in business service listings."
            tabs={<AdminModuleTabs tabs={catalogManagementTabs} />}
            actions={
                <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all" onClick={openCreateModal}>
                    <Plus size={18} />
                    Add Service Type
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
                                placeholder="Search service types..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                value={filters.search}
                                onChange={(e) => setFilters((prev: any) => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                        <select
                            className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                            value={filters.categoryId}
                            onChange={(e) => setFilters((prev: any) => ({ ...prev, categoryId: e.target.value }))}
                        >
                            <option value="all">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">{error}</div>
                    )}

                    <DataTable
                        data={serviceTypes}
                        columns={columns}
                        isLoading={loading}
                        emptyMessage="No service types found"
                        enableColumnVisibility
                        enableCsvExport
                        csvFileName="service-types.csv"
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
                    title={editingServiceType ? "Edit Service Type" : "Add New Service Type"}
                >
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                placeholder="e.g. Screen Replacement"
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Categories <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                {assignableCategories.map((cat) => (
                                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                                            checked={formData.categoryIds.includes(cat.id || "")}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                const catId = cat.id;
                                                if (!catId) return;
                                                setFormData((prev: ServiceTypeFormData) => ({
                                                    ...prev,
                                                    categoryIds: checked 
                                                        ? [...prev.categoryIds, catId]
                                                        : prev.categoryIds.filter((id: string) => id !== catId)
                                                }));
                                            }}
                                        />
                                        <span className="text-sm text-slate-700 group-hover:text-primary transition-colors">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-white hover:border-primary/50 transition-all">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                                checked={formData.isActive}
                                onChange={(e) => setFormData((prev: ServiceTypeFormData) => ({ ...prev, isActive: e.target.checked }))}
                            />
                            <span className="text-sm font-semibold text-slate-700">Active</span>
                        </label>

                        <div className="pt-4 flex gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100">
                                {loading ? "Saving..." : editingServiceType ? "Update" : "Create"}
                            </button>
                        </div>
                    </form>
                </CatalogModal>
            </>
        </AdminPageShell>
    );
}
