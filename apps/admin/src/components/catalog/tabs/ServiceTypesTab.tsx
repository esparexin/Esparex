"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Wrench, AlertTriangle, Loader2 } from "@esparex/ui";
import { CatalogBoundNameCategoryFields } from "@/components/catalog/CatalogNameCategoryFields";
import {
    CatalogActiveCheckboxField,
    CatalogCategoryTags,
    CatalogEntityCell,
    CatalogActiveToggleButton,
    CatalogEditDeleteActions,
    CatalogActiveStatusFilter,
    CatalogSelectFilter,
    CatalogSearchInput,
} from "@/components/catalog/primitives";
import { CatalogDeleteModal } from "@/components/catalog/CatalogDeleteModal";
import { useCatalogTabState } from "@/hooks/useCatalogTabState";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminServiceTypes, type ServiceType } from "@/hooks/useAdminServiceTypes";
import { categorySupportsServices, useAssignableCategories } from "@/hooks/useAssignableCategories";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { useCatalogQueryStateSync } from "@/hooks/useCatalogQueryStateSync";
import { normalizeSearchParamValue, parsePositiveIntParam } from "@/lib/urlSearchParams";
import { toCategoryOptions, validateRequiredCategoryIds } from "@/components/catalog/catalogDomainUtils";
import type { ServiceTypeMutationPayload } from "@/lib/api/serviceTypes";

export default function ServiceTypesTab() {
    const searchParams = useSearchParams();
    const initialSearch = normalizeSearchParamValue(searchParams.get("q") ?? searchParams.get("search"));
    const initialCategoryId = normalizeSearchParamValue(searchParams.get("categoryId")) || "all";
    const initialStatus = normalizeSearchParamValue(searchParams.get("status")) || "all";
    const initialPage = parsePositiveIntParam(searchParams.get("page"), 1);

    const { categories } = useAdminCategories();
    const {
        serviceTypes,
        loading,
        error,
        pagination,
        handleToggleStatus,
        handleDelete,
        handleCreate,
        handleUpdate,
    } = useAdminServiceTypes({
        initialFilters: {
            search: initialSearch,
            categoryId: initialCategoryId,
            status: initialStatus,
        },
        initialPagination: { page: 1, limit: 20 },
    });

    const {
        searchInput, setSearchInput,
        deletingItem: deletingServiceType, setDeletingItem: setDeletingServiceType,
        isDeleting, setIsDeleting, closeDelete, replaceQueryState
    } = useCatalogTabState<ServiceType>({ 
        totalPages: pagination.totalPages, 
        loading,
        initialSearch,
        initialCategoryId,
        initialStatus,
        initialPage
    });


    const confirmDelete = async () => {
        if (!deletingServiceType) return;
        setIsDeleting(true);
        const success = await handleDelete(deletingServiceType.id);
        setIsDeleting(false);
        if (success) setDeletingServiceType(null);
    };

    const { assignableCategories } = useAssignableCategories(
        categories,
        categorySupportsServices
    );
    const categoryOptions = toCategoryOptions(assignableCategories);

    return (
        <>
            <CatalogPageTemplate<ServiceType, ServiceTypeMutationPayload>
                isNested={true}
                title="Service Types"
                description="Manage service type master data used in business service listings."
                createLabel="Add Service Type"
                csvFileName="service-types.csv"
                items={serviceTypes}
                loading={loading}
                error={error}
                pagination={pagination}
                setPage={(page) => replaceQueryState({ page: page > 1 ? page : null })}
                handleCreate={handleCreate}
                handleUpdate={handleUpdate}
                defaultFormData={{ name: "", categoryIds: [], isActive: true }}
                customSubmitValidation={(formData) => {
                    return validateRequiredCategoryIds(formData.categoryIds);
                }}
                onModalOpen={(item, setFormData) => {
                    if (item) {
                        setFormData({
                            name: item.name,
                            categoryIds: item.categoryIds || [],
                            isActive: item.isActive,
                        });
                    }
                }}
                generateColumns={(openEditModal) => [
                    {
                        header: "Service Type",
                        cell: (serviceType) => (
                            <CatalogEntityCell
                                icon={<Wrench size={20} />}
                                iconClassName="bg-blue-50 text-blue-600"
                                title={serviceType.name}
                            />
                        ),
                    },
                    {
                        header: "Categories",
                        cell: (serviceType) => (
                            <CatalogCategoryTags
                                categoryIds={serviceType.categoryIds || []}
                                categories={categories}
                            />
                        ),
                    },
                    {
                        header: "Status",
                        cell: (serviceType) => (
                            <CatalogActiveToggleButton
                                isActive={serviceType.isActive}
                                onClick={() => void handleToggleStatus(serviceType)}
                            />
                        ),
                    },
                    {
                        header: "Actions",
                        className: "text-right",
                        cell: (serviceType) => (
                            <CatalogEditDeleteActions
                                onEdit={() => openEditModal(serviceType)}
                                onDelete={() => setDeletingServiceType(serviceType)}
                            />
                        ),
                    },
                ]}
                filterLayoutClassName="md:grid-cols-3"
                filtersRenderer={
                    <>
                        <CatalogSearchInput
                            value={searchInput}
                            placeholder="Search service types..."
                            onChange={setSearchInput}
                        />
                        <CatalogSelectFilter
                            value={initialCategoryId}
                            onChange={(categoryId) =>
                                replaceQueryState({
                                    categoryId: categoryId !== "all" ? categoryId : null,
                                    page: null,
                                })
                            }
                            options={[
                                { value: "all", label: "All Categories" },
                                ...categoryOptions.map((opt) => ({ value: opt.id, label: opt.name })),
                            ]}
                            withFilterIcon
                        />
                        <CatalogActiveStatusFilter
                            value={initialStatus}
                            onChange={(status) =>
                                replaceQueryState({
                                    status: status !== "all" ? status : null,
                                    page: null,
                                })
                            }
                        />
                    </>
                }
                formRenderer={(formData, setFormData) => (
                    <>
                        <CatalogBoundNameCategoryFields
                            formData={formData}
                            setFormData={setFormData}
                            nameLabel={
                                <>
                                    Name <span className="text-red-500">*</span>
                                </>
                            }
                            namePlaceholder="e.g. Screen Replacement"
                            categoryLabel={
                                <>
                                    Assigned Categories <span className="text-red-500">*</span>
                                </>
                            }
                            categoryOptions={categoryOptions}
                        />

                        <CatalogActiveCheckboxField
                            checked={formData.isActive}
                            onChange={(isActive) => setFormData((prev) => ({ ...prev, isActive }))}
                            label="Active"
                        />
                    </>
                )}
            />

            <CatalogDeleteModal
                isOpen={!!deletingServiceType}
                itemName={deletingServiceType?.name || ""}
                isDeleting={isDeleting}
                onClose={closeDelete}
                onConfirm={confirmDelete}
            />
        </>
    );
}
