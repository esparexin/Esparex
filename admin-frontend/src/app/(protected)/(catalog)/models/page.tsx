"use client";

import { useAdminModels } from "@/hooks/useAdminModels";
import { useAdminBrands } from "@/hooks/useAdminBrands";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { Model } from "@/types/model";
import { useAssignableCategories } from "@/hooks/useAssignableCategories";
import { Layers, AlertTriangle, Loader2 } from "lucide-react";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { CatalogBoundNameCategoryFields } from "@/components/catalog/CatalogNameCategoryFields";
import { adminModelSchema } from "@/schemas/admin.schemas";
import { normalizeObjectIdLike } from "@/lib/utils/idUtils";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { useState } from "react";
import {
    getEntityCategoryIds,
    hasCategoryOverlap,
    resolveModalAssignableCategoryState,
    toCategoryOptions,
    validateRequiredCategoryIds,
} from "@/components/catalog/catalogDomainUtils";
import {
    CatalogArchivedCategoryNotice,
    CatalogBoundSearchCategoryFilters,
    CatalogCategoryTags,
    CatalogEntityCell,
    CatalogEditDeleteActions,
    CatalogActiveToggleButton,
    CatalogSelectField,
    CatalogSelectFilter,
} from "@/components/catalog/CatalogUiPrimitives";

export default function ModelsPage() {
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
        setPage,
        handleToggleStatus
    } = useAdminModels();

    const [deletingModel, setDeletingModel] = useState<Model | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDelete = async () => {
        if (!deletingModel) return;
        setIsDeleting(true);
        const success = await handleDelete(deletingModel.id);
        setIsDeleting(false);
        if (success) setDeletingModel(null);
    };

    const { brands } = useAdminBrands();
    const { categories } = useAdminCategories();
    const { assignableCategories, assignableCategoryIdSet } = useAssignableCategories(categories);
    const categoryOptions = toCategoryOptions(assignableCategories);

    const [archivedCategoryCount, setArchivedCategoryCount] = useState(0);

    return (
        <>
        <CatalogPageTemplate<Model, { name: string; brandId: string; categoryIds: string[]; status: Model['status']; isActive: boolean }>
            title="Model Management"
            description="Manage product models and their brand and category mappings."
            createLabel="Add Model"
            csvFileName="models.csv"
            items={models}
            loading={loading}
            error={error}
            pagination={pagination}
            setPage={setPage}
            handleCreate={handleCreate}
            handleUpdate={handleUpdate}
            defaultFormData={{ name: "", brandId: "", categoryIds: [], status: "live", isActive: true }}
            validationSchema={adminModelSchema}
            customSubmitValidation={(formData) => {
                const categoryError = validateRequiredCategoryIds(formData.categoryIds);
                if (categoryError) return categoryError;
                const selectedBrand = brands.find((brand) => brand.id === formData.brandId);
                if (!hasCategoryOverlap(selectedBrand, formData.categoryIds)) {
                    return "Selected brand is not mapped to any of the selected categories";
                }
                return null;
            }}
            onModalOpen={(item, setFormData) => {
                if (item) {
                    const { assignableCategoryIds, archivedCategoryCount } = resolveModalAssignableCategoryState(
                        item,
                        assignableCategoryIdSet
                    );
                    setArchivedCategoryCount(archivedCategoryCount);
                    setFormData({
                        name: item.name,
                        brandId: normalizeObjectIdLike(item.brandId),
                        categoryIds: assignableCategoryIds,
                        status: item.status,
                        isActive: item.isActive
                    });
                } else {
                    setArchivedCategoryCount(0);
                }
            }}
            generateColumns={(openEditModal) => [
                {
                    header: "Model",
                    cell: (model) => (
                        <CatalogEntityCell
                            icon={<Layers size={20} />}
                            iconClassName="bg-blue-50 text-blue-600"
                            title={model.name}
                        />
                    )
                },
                {
                    header: "Brand / Categories",
                    cell: (model) => {
                        const brand = brands.find(b => b.id === normalizeObjectIdLike(model.brandId));
                        return (
                            <div className="text-xs space-y-1.5">
                                <div className="text-slate-900 font-bold">{brand?.name || "Unknown Brand"}</div>
                                <CatalogCategoryTags
                                    categoryIds={getEntityCategoryIds(model)}
                                    categories={categories}
                                />
                            </div>
                        );
                    }
                },
                {
                    header: "Status",
                    cell: (model) => (
                        <CatalogActiveToggleButton
                            isActive={model.isActive}
                            onClick={() => void handleToggleStatus(model.id)}
                            disabled={false}
                            loading={false}
                        />
                    )
                },
                {
                    header: "Approval State",
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
                        <CatalogEditDeleteActions
                            onEdit={() => openEditModal(model)}
                            onDelete={() => setDeletingModel(model)}
                        />
                    )
                }
            ]}
            filterLayoutClassName="md:grid-cols-4"
            filtersRenderer={
                <>
                    <CatalogBoundSearchCategoryFilters
                        filters={filters}
                        setFilters={setFilters}
                        searchPlaceholder="Search models..."
                        categories={categories}
                    />
                    <CatalogSelectFilter
                        value={filters.brandId}
                        onChange={(brandId) => setFilters((prev) => ({ ...prev, brandId }))}
                        options={[
                            { value: "all", label: "All Brands" },
                            ...brands.map((brand) => ({ value: brand.id, label: brand.name })),
                        ]}
                    />
                    <CatalogSelectFilter
                        value={filters.status}
                        onChange={(status) => setFilters((prev) => ({ ...prev, status: status as any }))}
                        options={[
                            { value: "all", label: "All Status" },
                            { value: "live", label: "Live" },
                            { value: "pending", label: "Pending" },
                            { value: "rejected", label: "Rejected" },
                        ]}
                    />
                </>
            }
            formRenderer={(formData, setFormData) => {
                const formBrands = formData.categoryIds.length > 0
                    ? brands.filter((brand) => {
                        const brandCats = getEntityCategoryIds(brand);
                        return brandCats.some(cid => formData.categoryIds.includes(cid));
                    })
                    : brands;

                return (
                    <>
                        <CatalogBoundNameCategoryFields
                            formData={formData}
                            setFormData={setFormData}
                            nameLabel="Model Name"
                            namePlaceholder="e.g. iPhone 15 Pro"
                            categoryLabel="Assigned Categories"
                            categoryOptions={categoryOptions}
                            categoryNotice={
                                <CatalogArchivedCategoryNotice archivedCategoryCount={archivedCategoryCount} />
                            }
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <CatalogSelectField
                                label="Brand"
                                value={formData.brandId}
                                onChange={(brandId: string) => setFormData((prev) => ({ ...prev, brandId }))}
                                options={formBrands.map((brand) => ({ value: brand.id, label: brand.name }))}
                                placeholder="Select Brand"
                                required
                            />

                            <CatalogSelectField
                                label="Status"
                                value={formData.status}
                                onChange={(status: string) => setFormData((prev) => ({ ...prev, status: status as any }))}
                                options={[
                                    { value: "live", label: "Live" },
                                    { value: "pending", label: "Pending" },
                                    { value: "rejected", label: "Rejected" },
                                ]}
                                placeholder=""
                            />
                        </div>
                    </>
                );
            }}
        />
        
        <CatalogModal
            isOpen={!!deletingModel}
            onClose={() => !isDeleting && setDeletingModel(null)}
            title="Delete Model"
        >
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <div>
                        <p className="text-sm font-semibold text-red-700">
                            Cascade delete — this cannot be undone
                        </p>
                        <p className="mt-1 text-sm text-red-600">
                            Deleting <strong>&ldquo;{deletingModel?.name}&rdquo;</strong> will also 
                            soft-delete all Spare Parts linked exclusively to this model.
                        </p>
                    </div>
                </div>
                <p className="text-sm text-slate-600">
                    To hide this model temporarily, <strong>deactivate it</strong> instead of deleting.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => setDeletingModel(null)}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => void confirmDelete()}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                        {isDeleting ? (
                            <><Loader2 size={14} className="animate-spin" /> Deleting…</>
                        ) : (
                            "Yes, Delete Model"
                        )}
                    </button>
                </div>
            </div>
        </CatalogModal>
        </>
    );
}
