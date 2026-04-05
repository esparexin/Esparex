"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Edit, Trash2 } from "lucide-react";
import { LISTING_TYPE, LISTING_TYPE_VALUES, type ListingTypeValue } from "@shared/enums/listingType";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import {
    CatalogActionsRow,
    CatalogActiveStatusFilter,
    CatalogActionIconButton,
    CatalogActiveToggleButton,
    CatalogCheckboxCard,
    CatalogCheckboxGroupField,
    CatalogEntityCell,
    CatalogListingTypeBadges,
    CatalogSearchInput,
    CatalogTextInputField,
    getListingTypeIcon,
} from "@/components/catalog/CatalogUiPrimitives";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useCatalogQueryStateSync } from "@/hooks/useCatalogQueryStateSync";
import { normalizeSearchParamValue, parsePositiveIntParam } from "@/lib/urlSearchParams";
import { adminCategorySchema } from "@/schemas/admin.schemas";
import type { Category } from "@/types/category";

type CategoryFormData = {
    name: string;
    isActive: boolean;
    hasScreenSizes: boolean;
    listingType: ListingTypeValue[];
    _editingSlug?: string;
};

const CATEGORY_STATUS_VALUES = new Set(["all", "active", "inactive"]);
const LISTING_TYPE_SET = new Set<string>(LISTING_TYPE_VALUES);

const normalizeCategoryStatusParam = (value: string | null) =>
    value && CATEGORY_STATUS_VALUES.has(value) ? value : "all";

const isListingTypeValue = (value: string): value is ListingTypeValue => LISTING_TYPE_SET.has(value);

const listingTypeOptions: Array<{ value: ListingTypeValue; label: string }> = [
    { value: LISTING_TYPE.AD, label: "Device Listings" },
    { value: LISTING_TYPE.SERVICE, label: "Service Listings" },
    { value: LISTING_TYPE.SPARE_PART, label: "Spare Part Listings" },
];

type CategoriesPageContentProps = {
    initialSearch: string;
    initialStatus: string;
    initialPage: number;
};

function CategoriesPageContent({ initialSearch, initialStatus, initialPage }: CategoriesPageContentProps) {
    const [searchInput, setSearchInput] = useState(initialSearch);

    const {
        categories,
        loading,
        error,
        handleToggleStatus,
        handleDelete,
        handleCreate,
        handleUpdate,
        pagination,
    } = useAdminCategories({
        initialFilters: {
            search: initialSearch,
            status: initialStatus,
        },
        initialPagination: {
            page: initialPage,
            limit: 20,
        },
    });

    useEffect(() => {
        setSearchInput(initialSearch);
    }, [initialSearch]);

    const { replaceQueryState } = useCatalogQueryStateSync({
        searchInput,
        initialSearch,
        loading,
        initialPage,
        totalPages: pagination.totalPages,
    });

    return (
        <CatalogPageTemplate<Category, CategoryFormData>
            title="Categories"
            description="Root device categories — the SSOT for Post Ad step 1, search filters, alert matching, and fraud detection. Every brand, model, and spare part is anchored to a category here."
            createLabel="Add Category"
            csvFileName="categories.csv"
            items={categories}
            loading={loading}
            error={error}
            pagination={pagination}
            setPage={(page) => replaceQueryState({ page: page > 1 ? page : null })}
            handleCreate={(data) => {
                const { _editingSlug, ...payload } = data;
                return handleCreate(payload);
            }}
            handleUpdate={(id, data) => {
                const { _editingSlug, ...payload } = data;
                return handleUpdate(id, payload);
            }}
            defaultFormData={{
                name: "",
                isActive: true,
                hasScreenSizes: false,
                listingType: [LISTING_TYPE.AD],
                _editingSlug: "",
            }}
            customSubmitValidation={(formData) => {
                const slug =
                    formData._editingSlug ||
                    formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                const validation = adminCategorySchema.safeParse({
                    name: formData.name,
                    slug,
                    listingType: formData.listingType,
                    hasScreenSizes: formData.hasScreenSizes,
                });
                if (!validation.success) return validation.error.issues[0]?.message || "Invalid form data";
                if (formData.listingType.length === 0) return "At least one listing type is required";
                return null;
            }}
            onModalOpen={(item, setFormData) => {
                if (item) {
                    setFormData({
                        name: item.name,
                        isActive: item.isActive,
                        hasScreenSizes: item.hasScreenSizes || false,
                        listingType: Array.isArray(item.listingType)
                            ? item.listingType.filter(isListingTypeValue)
                            : [],
                        _editingSlug: item.slug,
                    });
                }
            }}
            generateColumns={(openEditModal) => [
                {
                    header: "Category",
                    cell: (category) => (
                        <CatalogEntityCell
                            icon={getListingTypeIcon(category.listingType?.[0] || LISTING_TYPE.AD, 20)}
                            iconClassName="bg-slate-100 text-slate-600"
                            title={category.name}
                            subtitle={category.slug}
                        />
                    ),
                },
                {
                    header: "Listing Types",
                    cell: (category) => <CatalogListingTypeBadges types={category.listingType} />,
                },
                {
                    header: "Status",
                    cell: (category) => (
                        <CatalogActiveToggleButton
                            isActive={category.isActive}
                            onClick={() => void handleToggleStatus(category.id)}
                        />
                    ),
                },
                {
                    header: "Actions",
                    className: "text-right",
                    cell: (category) => (
                        <CatalogActionsRow>
                            <CatalogActionIconButton
                                onClick={() => openEditModal(category)}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                title="Edit"
                                icon={<Edit size={18} />}
                            />
                            <CatalogActionIconButton
                                onClick={() => void handleDelete(category.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                                icon={<Trash2 size={18} />}
                            />
                        </CatalogActionsRow>
                    ),
                },
            ]}
            filterLayoutClassName="md:grid-cols-3"
            filtersRenderer={
                <>
                    <CatalogSearchInput
                        value={searchInput}
                        placeholder="Search categories..."
                        onChange={setSearchInput}
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
                    <CatalogTextInputField
                        label="Category Name"
                        placeholder="e.g. Smartphones"
                        value={formData.name}
                        maxLength={50}
                        onChange={(name) => setFormData((prev) => ({ ...prev, name }))}
                    />

                    <CatalogCheckboxGroupField
                        label="Listing Types"
                        options={listingTypeOptions}
                        selectedValues={formData.listingType}
                        onChange={(listingType) =>
                            setFormData((prev) => ({
                                ...prev,
                                listingType: listingType.filter(isListingTypeValue),
                            }))
                        }
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <CatalogCheckboxCard
                            checked={formData.isActive}
                            onChange={(isActive) => setFormData((prev) => ({ ...prev, isActive }))}
                            label="Active"
                        />

                        <CatalogCheckboxCard
                            checked={formData.hasScreenSizes}
                            onChange={(hasScreenSizes) => setFormData((prev) => ({ ...prev, hasScreenSizes }))}
                            label="Screen Sizes"
                        />
                    </div>
                </>
            )}
        />
    );
}

export default function CategoriesPage() {
    const searchParams = useSearchParams();
    const initialSearch = normalizeSearchParamValue(searchParams.get("search"));
    const initialStatus = normalizeCategoryStatusParam(searchParams.get("status"));
    const initialPage = parsePositiveIntParam(searchParams.get("page"), 1);

    return (
        <CategoriesPageContent
            key={`${initialSearch}:${initialStatus}:${initialPage}`}
            initialSearch={initialSearch}
            initialStatus={initialStatus}
            initialPage={initialPage}
        />
    );
}
