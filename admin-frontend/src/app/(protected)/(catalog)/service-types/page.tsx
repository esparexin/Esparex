"use client";

import { useState } from "react";

import { Wrench, AlertTriangle, Loader2 } from "lucide-react";

import { CatalogBoundNameCategoryFields } from "@/components/catalog/CatalogNameCategoryFields";
import {
    CatalogActiveCheckboxField,
    CatalogBoundSearchCategoryFilters,
    CatalogCategoryTags,
    CatalogEntityCell,
    CatalogActiveToggleButton,
    CatalogEditDeleteActions,
} from "@/components/catalog/CatalogUiPrimitives";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminServiceTypes, type ServiceType } from "@/hooks/useAdminServiceTypes";
import { categorySupportsServices, useAssignableCategories } from "@/hooks/useAssignableCategories";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { toCategoryOptions, validateRequiredCategoryIds } from "@/components/catalog/catalogDomainUtils";

type ServiceTypeFormData = {
    name: string;
    categoryIds: string[];
    isActive: boolean;
};

export default function ServiceTypesPage() {
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

    return (
        <>
        <CatalogPageTemplate<ServiceType, ServiceTypeFormData>
            title="Service Types"
            description="Manage service type master data used in business service listings."
            createLabel="Add Service Type"
            csvFileName="service-types.csv"
            items={serviceTypes}
            loading={loading}
            error={error}
            pagination={pagination}
            setPage={setPage}
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
            filterLayoutClassName="md:grid-cols-2"
            filtersRenderer={
                <>
                    <CatalogBoundSearchCategoryFilters
                        filters={filters}
                        setFilters={setFilters as any}
                        searchPlaceholder="Search service types..."
                        categories={categories}
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
