"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Edit, Trash2, Monitor, AlignJustify, AlertTriangle, Loader2 } from "lucide-react";
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
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useCatalogQueryStateSync } from "@/hooks/useCatalogQueryStateSync";
import { normalizeSearchParamValue, parsePositiveIntParam } from "@/lib/urlSearchParams";
import { adminCategorySchema } from "@/schemas/admin.schemas";
import type { Category } from "@shared/schemas/catalog.schema";

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

/** Derive the URL-safe slug preview from a name string */
const deriveSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

type CategoriesPageContentProps = {
    initialSearch: string;
    initialStatus: string;
    initialPage: number;
};

function CategoriesPageContent({ initialSearch, initialStatus, initialPage }: CategoriesPageContentProps) {
    const [searchInput, setSearchInput] = useState(initialSearch);
    // UX Gap 4 + Bug 4: Delete confirmation state (replaces window.confirm)
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        categories,
        loading,
        error,
        handleToggleStatus,
        handleDelete,
        handleCreate,
        handleUpdate,
        pagination,
        isTogglingId,
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

    const confirmDelete = async () => {
        if (!deletingCategory) return;
        setIsDeleting(true);
        await handleDelete(deletingCategory.id);
        setIsDeleting(false);
        setDeletingCategory(null);
    };

    return (
        <>
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
                        deriveSlug(formData.name);
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
                        // UX Gap 1: Show category type
                        header: "Type",
                        cell: (category) => (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                                <AlignJustify size={11} />
                                {category.type ?? "ad"}
                            </span>
                        ),
                    },
                    {
                        header: "Listing Types",
                        cell: (category) => <CatalogListingTypeBadges types={category.listingType} />,
                    },
                    {
                        // UX Gap 2: Show hasScreenSizes indicator
                        header: "Screen Sizes",
                        cell: (category) =>
                            category.hasScreenSizes ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                    <Monitor size={11} /> Yes
                                </span>
                            ) : (
                                <span className="text-[11px] text-slate-400">—</span>
                            ),
                    },
                    {
                        // UX Gap 6: disabled + loading when toggling
                        header: "Status",
                        cell: (category) => (
                            <CatalogActiveToggleButton
                                isActive={category.isActive}
                                onClick={() => void handleToggleStatus(category.id)}
                                disabled={isTogglingId === category.id}
                                loading={isTogglingId === category.id}
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
                                    onClick={() => setDeletingCategory(category)}
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
                formRenderer={(formData, setFormData, isEditing) => (
                    <>
                        <CatalogTextInputField
                            label="Category Name"
                            placeholder="e.g. Smartphones"
                            value={formData.name}
                            maxLength={50}
                            onChange={(name) => setFormData((prev) => ({ ...prev, name }))}
                        />

                        {/* UX Gap 3: Slug preview */}
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">URL Slug</p>
                            <p className="mt-0.5 font-mono text-sm text-slate-700 break-all">
                                {isEditing && formData._editingSlug
                                    ? formData._editingSlug
                                    : deriveSlug(formData.name) || "auto-generated from name"}
                            </p>
                            {isEditing && (
                                <p className="mt-1 text-[11px] text-amber-600">
                                    ⚠ Slug is fixed on create. Changing name will not change the slug.
                                </p>
                            )}
                        </div>

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

            {/* UX Gap 4 + Bug 4: Cascade-aware Delete Confirmation Modal (replaces window.confirm) */}
            <CatalogModal
                isOpen={!!deletingCategory}
                onClose={() => !isDeleting && setDeletingCategory(null)}
                title="Delete Category"
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                        <div>
                            <p className="text-sm font-semibold text-red-700">
                                Cascade delete — this cannot be undone
                            </p>
                            <p className="mt-1 text-sm text-red-600">
                                Deleting <strong>&ldquo;{deletingCategory?.name}&rdquo;</strong> will also
                                soft-delete all Brands, Models, Spare Parts, and Screen Sizes linked exclusively
                                to this category.
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600">
                        To hide this category temporarily, <strong>deactivate it</strong> instead of deleting.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => setDeletingCategory(null)}
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
                                "Yes, Delete Category"
                            )}
                        </button>
                    </div>
                </div>
            </CatalogModal>
        </>
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
