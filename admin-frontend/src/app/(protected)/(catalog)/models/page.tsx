"use client";

import { useAdminModels } from "@/hooks/useAdminModels";
import { useAdminBrands } from "@/hooks/useAdminBrands";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { Model } from "@/types/model";
import { useAssignableCategories } from "@/hooks/useAssignableCategories";
import { Layers } from "lucide-react";
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
        setPage
    } = useAdminModels();

    const { brands } = useAdminBrands();
    const { categories } = useAdminCategories();
    const { assignableCategories, assignableCategoryIdSet } = useAssignableCategories(categories);
    const categoryOptions = toCategoryOptions(assignableCategories);

    const [archivedCategoryCount, setArchivedCategoryCount] = useState(0);

    return (
        <CatalogPageTemplate<Model, { name: string; brandId: string; categoryIds: string[]; status: Model['status'] }>
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
            defaultFormData={{ name: "", brandId: "", categoryIds: [], status: "live" }}
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
                        status: item.status
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
                            onDelete={() => void handleDelete(model.id)}
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
    );
}
