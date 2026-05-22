"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Wrench, AlertTriangle, Loader2 } from "lucide-react";
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
} from "@/components/catalog/CatalogUiPrimitives";
import { CatalogModal } from "@/components/catalog/CatalogModal";
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

    const [searchInput, setSearchInput] = useState(initialSearch);

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
        initialPagination: {
            page: initialPage,
            limit: 20,
        },
    });

    const [deletingServiceType, setDeletingServiceType] = useState<ServiceType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const { replaceQueryState } = useCatalogQueryStateSync({
        searchInput,
        initialSearch,
        loading,
        initialPage,
        totalPages: pagination.totalPages,
    });

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

            <CatalogModal
                isOpen={!!deletingServiceType}
                onClose={() => !isDeleting && setDeletingServiceType(null)}
                title="Delete Service Type"
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                        <div>
                            <p className="text-sm font-semibold text-red-700">
                                Delete confirmation
                            </p>
                            <p className="mt-1 text-sm text-red-600">
                                Are you sure you want to delete <strong>&ldquo;{deletingServiceType?.name}&rdquo;</strong>?
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => setDeletingServiceType(null)}
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
                                "Yes, Delete Service Type"
                            )}
                        </button>
                    </div>
                </div>
            </CatalogModal>
        </>
    );
}
