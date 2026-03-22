"use client";

import { useAdminCategories } from "@/hooks/useAdminCategories";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Category } from "@/types/category";
import {
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Trash2,
    Plus,
    Smartphone,
    Wrench,
    Briefcase,
    Box,
    X,
    Edit
} from "lucide-react";
import { useState } from "react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { catalogManagementTabs } from "@/components/layout/adminModuleTabSets";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { adminCategorySchema } from "@/schemas/admin.schemas";
import { z } from "zod";
import { FORM_PLACEMENT_VALUES, type FormPlacement } from "@shared/enums/listingType";

const getIcon = (listingType: string[] = []) => {
    if (listingType.includes('postad')) return <Smartphone size={20} />;
    if (listingType.includes('postservice')) return <Briefcase size={20} />;
    if (listingType.includes('postsparepart')) return <Wrench size={20} />;
    return <Box size={20} />;
};

export default function CategoriesPage() {
    const {
        categories,
        loading,
        error,
        filters,
        setFilters,
        handleToggleStatus,
        handleDelete,
        handleCreate,
        handleUpdate,
        pagination,
        setPage
    } = useAdminCategories();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const LISTING_TYPES = FORM_PLACEMENT_VALUES;

    const [formData, setFormData] = useState({
        name: "",
        isActive: true,
        hasScreenSizes: false,
        listingType: [] as FormPlacement[]
    });


    const openCreateModal = () => {
        setEditingCategory(null);
        setValidationError(null);
        setFormData({
            name: "",
            isActive: true,
            hasScreenSizes: false,
            listingType: ['postad']
        });
        setIsModalOpen(true);
    };

    const openEditModal = (cat: Category) => {
        setEditingCategory(cat);
        setValidationError(null);
        setFormData({
            name: cat.name,
            isActive: cat.isActive,
            hasScreenSizes: cat.hasScreenSizes || false,
            listingType: Array.isArray(cat.listingType)
                ? cat.listingType.filter((lt): lt is FormPlacement => LISTING_TYPES.includes(lt as FormPlacement))
                : []
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        // Pre-submit validation guard
        const validation = adminCategorySchema.safeParse({
            name: formData.name,
            slug: editingCategory ? editingCategory.slug : formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        });

        if (!validation.success) {
            setValidationError(validation.error.issues[0]?.message || "Invalid form data");
            return;
        }

        if (formData.listingType.length === 0) {
            setValidationError("At least one Listing Type is required");
            return;
        }

        const allowedListingTypes = ['postad', 'postservice', 'postsparepart'];
        // Bug #1 fix: use the filtered list in the payload
        const filteredListingType = formData.listingType.filter(lt => allowedListingTypes.includes(lt));

        const payload = {
            name: formData.name,
            isActive: formData.isActive,
            hasScreenSizes: formData.hasScreenSizes,
            listingType: filteredListingType
        };
        const success = editingCategory
            ? await handleUpdate(editingCategory.id, payload)
            : await handleCreate(payload);

        if (success) {
            setIsModalOpen(false);
        }
    };

    const columns: ColumnDef<Category>[] = [
        {
            header: "Category",
            cell: (cat) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                        {getIcon(cat.listingType)}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">{cat.name}</div>
                        <div className="text-xs text-slate-500">{cat.slug}</div>
                    </div>
                </div>
            )
        },
        {
            header: "Features",
            cell: (cat) => (
                <div className="flex flex-wrap gap-1">
                    {cat.hasScreenSizes && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 border border-blue-100">
                            Screen Sizes
                        </span>
                    )}
                </div>
            )
        },
        {
            header: "Status",
            cell: (cat) => (
                <button
                    onClick={() => void handleToggleStatus(cat.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${cat.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}>
                    {cat.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {cat.isActive ? "Active" : "Inactive"}
                </button>
            )
        },
        {
            header: "Actions",
            className: "text-right",
            cell: (cat) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        title="Edit"
                    >
                        <Edit size={18} />
                    </button>
                    <button
                        onClick={() => void handleDelete(cat.id)}
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
            title="Categories"
            description="Root device categories — the SSOT for Post Ad step 1, search filters, alert matching, and fraud detection. Every brand, model, and spare part is anchored to a category here."
            tabs={<AdminModuleTabs tabs={catalogManagementTabs} />}
            actions={
                <button
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    onClick={openCreateModal}
                >
                    <Plus size={18} />
                    Add Category
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
                        placeholder="Search categories..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                </div>
            </div>

            {
                error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                        {error}
                    </div>
                )
            }

            <DataTable
                data={categories}
                columns={columns}
                isLoading={loading}
                emptyMessage="No categories found"
                enableColumnVisibility
                enableCsvExport
                csvFileName="categories.csv"
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
                title={editingCategory ? "Edit Category" : "Add New Category"}
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {validationError && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-2">
                                    <XCircle size={14} />
                                    {validationError}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Category Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    maxLength={50}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    placeholder="e.g. Smartphones"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>


                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Listing Types (Placement)
                                </label>
                                <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    {[
                                        { id: 'postad', label: 'Post Ad (Devices)' },
                                        { id: 'postservice', label: 'Post Service' },
                                        { id: 'postsparepart', label: 'Post Spare Part' }
                                    ].map(type => (
                                        <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                                                checked={formData.listingType.includes(type.id as FormPlacement)}
                                                onChange={(e) => {
                                                    const current = new Set(formData.listingType);
                                                    if (e.target.checked) current.add(type.id as FormPlacement);
                                                    else current.delete(type.id as FormPlacement);
                                                    setFormData(prev => ({ ...prev, listingType: Array.from(current) }));
                                                }}
                                            />
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">
                                                {type.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>



                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer group hover:bg-white hover:border-primary/50 transition-all">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Active</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer group hover:bg-white hover:border-primary/50 transition-all">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                                        checked={formData.hasScreenSizes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, hasScreenSizes: e.target.checked }))}
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Screen Sizes</span>
                                </label>
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
                                    {loading ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                                </button>
                            </div>
                        </form>
            </CatalogModal>
        </div>
        </>
        </AdminPageShell>
    );
}
