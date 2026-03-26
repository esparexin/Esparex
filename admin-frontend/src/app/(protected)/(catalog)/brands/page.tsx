"use client";

import { useAdminBrands } from "@/hooks/useAdminBrands";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { Brand } from "@/types/brand";
import { useAssignableCategories } from "@/hooks/useAssignableCategories";
import { Tag, CheckCircle, XCircle } from "lucide-react";
import { CatalogBoundNameCategoryFields } from "@/components/catalog/CatalogNameCategoryFields";
import { adminBrandSchema } from "@/schemas/admin.schemas";
import { normalizeObjectIdLike } from "@/lib/utils/idUtils";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { useState } from "react";
import {
    getEntityCategoryIds,
    resolveModalAssignableCategoryState,
    toCategoryOptions,
} from "@/components/catalog/catalogDomainUtils";
import {
    CatalogActionsRow,
    CatalogActionIconButton,
    CatalogActiveCheckboxField,
    CatalogArchivedCategoryNotice,
    CatalogBoundSearchCategoryFilters,
    CatalogCategoryTags,
    CatalogEntityCell,
    CatalogEditDeleteActionPair,
    CatalogSelectFilter,
} from "@/components/catalog/CatalogUiPrimitives";

export default function BrandsPage() {
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

    const { categories } = useAdminCategories();
    const { assignableCategories, assignableCategoryIdSet } = useAssignableCategories(
        categories,
        (cat) => cat.listingType?.includes('postad') || false
    );
    const categoryOptions = toCategoryOptions(assignableCategories);

    const [archivedCategoryCount, setArchivedCategoryCount] = useState(0);

    return (
        <CatalogPageTemplate<Brand, { name: string; categoryIds: string[]; isActive: boolean }>
            title="Brand Management"
            description="Manage product brands and their category assignments."
            createLabel="Add Brand"
            csvFileName="brands.csv"
            items={brands}
            loading={loading}
            error={error}
            pagination={pagination}
            setPage={setPage}
            handleCreate={handleCreate}
            handleUpdate={handleUpdate}
            defaultFormData={{ name: "", categoryIds: [], isActive: true }}
            validationSchema={adminBrandSchema}
            onModalOpen={(item, setFormData) => {
                if (item) {
                    const { assignableCategoryIds, archivedCategoryCount } = resolveModalAssignableCategoryState(
                        item,
                        assignableCategoryIdSet
                    );
                    setArchivedCategoryCount(archivedCategoryCount);
                    setFormData({
                        name: item.name,
                        categoryIds: assignableCategoryIds,
                        isActive: item.isActive
                    });
                } else {
                    setArchivedCategoryCount(0);
                }
            }}
            generateColumns={(openEditModal) => [
                {
                    header: "Brand",
                    cell: (brand) => (
                        <CatalogEntityCell
                            icon={<Tag size={20} />}
                            iconClassName="bg-orange-50 text-orange-600"
                            title={brand.name}
                        />
                    )
                },
                {
                    header: "Categories",
                    cell: (brand) => (
                        <CatalogCategoryTags
                            categoryIds={getEntityCategoryIds(brand)}
                            categories={categories}
                        />
                    )
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
                            <CatalogActionsRow>
                                {brand.status === 'pending' && (
                                    <>
                                        <CatalogActionIconButton
                                            onClick={() => void handleApprove(brand.id)}
                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                            title="Approve"
                                            icon={<CheckCircle size={18} />}
                                        />
                                        <CatalogActionIconButton
                                            onClick={() => {
                                                const reason = prompt("Reason for rejection:");
                                                if (reason) void handleReject(brand.id, reason);
                                            }}
                                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                            title="Reject"
                                            icon={<XCircle size={18} />}
                                        />
                                    </>
                                )}
                                <CatalogEditDeleteActionPair
                                    onEdit={() => openEditModal(brand)}
                                    onDelete={() => void handleDelete(brand.id)}
                                />
                            </CatalogActionsRow>
                        );
                    }
                }
            ]}
            filterLayoutClassName="md:grid-cols-3"
            filtersRenderer={
                <>
                    <CatalogBoundSearchCategoryFilters
                        filters={filters}
                        setFilters={setFilters}
                        searchPlaceholder="Search brands..."
                        withCategoryFilterIcon
                        categories={categories}
                    />
                    <CatalogSelectFilter
                        value={filters.status}
                        onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
                        options={[
                            { value: "all", label: "All Status" },
                            { value: "live", label: "Live Only" },
                            { value: "inactive", label: "Inactive Only" },
                            { value: "pending", label: "Pending Only" },
                            { value: "rejected", label: "Rejected Only" },
                        ]}
                    />
                </>
            }
            formRenderer={(formData, setFormData) => (
                <>
                    <CatalogBoundNameCategoryFields
                        formData={formData}
                        setFormData={setFormData}
                        nameLabel="Brand Name"
                        namePlaceholder="e.g. Samsung"
                        categoryLabel="Assigned Categories"
                        categoryOptions={categoryOptions}
                        categoryNotice={
                            <CatalogArchivedCategoryNotice
                                archivedCategoryCount={archivedCategoryCount}
                                suffix="Select active categories and save to clean up the brand."
                            />
                        }
                    />
                    <CatalogActiveCheckboxField
                        checked={formData.isActive}
                        onChange={(isActive) => setFormData((prev) => ({ ...prev, isActive }))}
                        label="Active Status"
                    />
                </>
            )}
        />
    );
}
