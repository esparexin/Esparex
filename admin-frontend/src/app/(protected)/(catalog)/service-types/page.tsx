"use client";

import { Trash2, Edit, ToggleLeft, Wrench } from "lucide-react";

import { CatalogBoundNameCategoryFields } from "@/components/catalog/CatalogNameCategoryFields";
import {
    CatalogActionsRow,
    CatalogActionIconButton,
    CatalogActiveCheckboxField,
    CatalogBoundSearchCategoryFilters,
    CatalogCategoryTags,
    CatalogEntityCell,
    CatalogStatusBadge,
} from "@/components/catalog/CatalogUiPrimitives";
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

    const { assignableCategories } = useAssignableCategories(
        categories,
        categorySupportsServices
    );
    const categoryOptions = toCategoryOptions(assignableCategories);

    return (
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
                        <CatalogStatusBadge
                            label={serviceType.isActive ? "Active" : "Inactive"}
                            tone={serviceType.isActive ? "success" : "danger"}
                        />
                    ),
                },
                {
                    header: "Actions",
                    className: "text-right",
                    cell: (serviceType) => (
                        <CatalogActionsRow>
                            <CatalogActionIconButton
                                onClick={() => openEditModal(serviceType)}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                title="Edit"
                                icon={<Edit size={18} />}
                            />
                            <CatalogActionIconButton
                                onClick={() => void handleToggleStatus(serviceType)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title={serviceType.isActive ? "Deactivate" : "Activate"}
                                icon={<ToggleLeft size={18} />}
                            />
                            <CatalogActionIconButton
                                onClick={() => void handleDelete(serviceType.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                                icon={<Trash2 size={18} />}
                            />
                        </CatalogActionsRow>
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
    );
}
