"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Wrench } from "lucide-react";
import { LISTING_TYPE, type ListingTypeValue } from "@shared/enums/listingType";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { sparePartsMasterTabs } from "@/components/layout/adminModuleTabSets";
import { CatalogBoundNameCategoryFields } from "@/components/catalog/CatalogNameCategoryFields";
import {
    CatalogCategoryTags,
    CatalogEditDeleteActions,
    CatalogEntityCell,
    CatalogSearchAndCategoryFilters,
    CatalogSelectFilter,
    CatalogActiveToggleButton,
} from "@/components/catalog/CatalogUiPrimitives";
import {
    buildSpareCategoryDisplayRows,
    getEntityCategoryIds,
    validateRequiredCategoryIds,
} from "@/components/catalog/catalogDomainUtils";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useCatalogQueryStateSync } from "@/hooks/useCatalogQueryStateSync";
import { useAdminSpareParts } from "@/hooks/useAdminSparePartCatalog";
import { categorySupportsSpareParts, useAssignableCategories } from "@/hooks/useAssignableCategories";
import { normalizeSearchParamValue, parsePositiveIntParam } from "@/lib/urlSearchParams";
import type { SparePart } from "@shared/schemas/catalog.schema";
import { CatalogModal } from "@/components/catalog/CatalogModal";

type SparePartFormData = {
    name: string;
    categoryIds: string[];
    listingType: ("ad" | "spare_part")[];
    isActive: boolean;
    sortOrder: number;
};

const VALID_IS_ACTIVE_VALUES = new Set(["all", "true", "false"]);
const VALID_SPARE_PART_LISTING_TYPES = new Set<string>([LISTING_TYPE.AD, LISTING_TYPE.SPARE_PART]);

const normalizeActiveParam = (value: string | null) =>
    value && VALID_IS_ACTIVE_VALUES.has(value) ? value : "all";

const normalizeCategoryParam = (value: string | null) => normalizeSearchParamValue(value) || "all";

const isSparePartListingType = (value: string): value is "ad" | "spare_part" =>
    VALID_SPARE_PART_LISTING_TYPES.has(value);

type SparePartsCatalogPageContentProps = {
    initialSearch: string;
    initialCategoryId: string;
    initialIsActive: string;
    initialPage: number;
};

function SparePartsCatalogPageContent({
    initialSearch,
    initialCategoryId,
    initialIsActive,
    initialPage,
}: SparePartsCatalogPageContentProps) {
    const [searchInput, setSearchInput] = useState(initialSearch);

    const {
        parts,
        loading,
        error,
        handleDelete,
        handleCreate,
        handleUpdate,
        pagination,
        toggleStatus,
        isTogglingId,
    } = useAdminSpareParts({
        initialFilters: {
            search: initialSearch,
            categoryId: initialCategoryId,
            isActive: initialIsActive,
        },
        initialPagination: {
            page: initialPage,
            limit: 20,
        },
    });

    const { categories } = useAdminCategories({ initialPagination: { limit: 500 } });
    const {
        assignableCategories: assignableSpareCategories,
        assignableCategoryIdSet: assignableSpareCategoryIds,
    } = useAssignableCategories(categories, categorySupportsSpareParts);

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

    const [deletingItem, setDeletingItem] = useState<SparePart | null>(null);

    return (
        <>
        <CatalogPageTemplate<SparePart, SparePartFormData>
            title="Spare Parts Master"
            description="Global master list of spare parts — the SSOT for Post Ad Power-Off flow, spare parts marketplace, and repair service linking."
            createLabel="Add Master Part"
            csvFileName="spare-parts-catalog.csv"
            tabs={sparePartsMasterTabs}
            items={parts}
            loading={loading}
            error={error}
            pagination={pagination}
            setPage={(page) => replaceQueryState({ page: page > 1 ? page : null })}
            handleCreate={handleCreate}
            handleUpdate={handleUpdate}
            defaultFormData={{
                name: "",
                categoryIds: [],
                listingType: [LISTING_TYPE.SPARE_PART],
                isActive: true,
                sortOrder: 0,
            }}
            customSubmitValidation={(formData) => {
                const categoryError = validateRequiredCategoryIds(formData.categoryIds);
                if (categoryError) return categoryError;
                const hasInactiveCategory = formData.categoryIds.some((categoryId) => !assignableSpareCategoryIds.has(categoryId));
                if (hasInactiveCategory) {
                    return "Invalid or inactive categories cannot be assigned. Please uncheck categories marked with errors.";
                }
                return null;
            }}
            onModalOpen={(item, setFormData) => {
                if (item) {
                    setFormData({
                        name: item.name,
                        categoryIds: getEntityCategoryIds(item),
                        listingType: (Array.isArray(item.listingType)
                            ? item.listingType.filter(isSparePartListingType)
                            : [LISTING_TYPE.SPARE_PART]) as ("ad" | "spare_part")[],
                        isActive: item.isActive !== false,
                        sortOrder: item.sortOrder || 0,
                    });
                }
            }}
            generateColumns={(openEditModal) => [
                {
                    header: "Part Name",
                    cell: (part) => (
                        <CatalogEntityCell
                            icon={<Wrench size={20} />}
                            iconClassName="bg-indigo-50 text-indigo-600"
                            title={part.name}
                            subtitle={part.slug}
                        />
                    ),
                },
                {
                    header: "Categories",
                    cell: (part) => (
                        <CatalogCategoryTags
                            categoryIds={part.categoryIds || []}
                            categories={categories}
                            validateId={(id: string) => assignableSpareCategoryIds.has(id)}
                        />
                    ),
                },
                {
                    header: "Status",
                    cell: (part) => (
                        <CatalogActiveToggleButton
                            isActive={part.isActive !== false}
                            onClick={() => toggleStatus(part.id, part.isActive !== false)}
                            disabled={!!isTogglingId && isTogglingId !== part.id}
                            loading={isTogglingId === part.id}
                        />
                    ),
                },
                {
                    header: "Actions",
                    className: "text-right",
                    cell: (part) => (
                        <CatalogEditDeleteActions
                            onEdit={() => openEditModal(part)}
                            onDelete={() => setDeletingItem(part)}
                        />
                    ),
                },
            ]}
            filterLayoutClassName="md:grid-cols-3"
            filtersRenderer={
                <>
                    <CatalogSearchAndCategoryFilters
                        searchValue={searchInput}
                        onSearchChange={setSearchInput}
                        searchPlaceholder="Search parts catalog..."
                        categories={categories}
                        categoryValue={initialCategoryId}
                        onCategoryChange={(categoryId) =>
                            replaceQueryState({
                                categoryId: categoryId !== "all" ? categoryId : null,
                                page: null,
                            })
                        }
                    />
                    <CatalogSelectFilter
                        value={initialIsActive}
                        onChange={(isActive) =>
                            replaceQueryState({
                                isActive: isActive !== "all" ? isActive : null,
                                page: null,
                            })
                        }
                        options={[
                            { value: "all", label: "All Status" },
                            { value: "true", label: "Active" },
                            { value: "false", label: "Inactive (Hidden)" },
                        ]}
                    />
                </>
            }
            formRenderer={(formData, setFormData) => {
                const displayCategories = buildSpareCategoryDisplayRows(
                    categories,
                    assignableSpareCategories,
                    formData.categoryIds,
                    assignableSpareCategoryIds
                );

                return (
                    <>
                        <CatalogBoundNameCategoryFields
                            formData={formData}
                            setFormData={setFormData}
                            nameLabel="Part Name"
                            namePlaceholder="e.g. Battery"
                            categoryLabel="Associated Categories"
                            categoryLayout="list"
                            categoryOptions={displayCategories.map((category) => ({
                                id: category.id,
                                name: category.name,
                                hint: category.errorHint,
                                tone: category.isInvalid ? "danger" : "default",
                                title: category.isInvalid ? "This category is inactive or invalid for spare parts" : undefined,
                            }))}
                            categoryFooter={
                                formData.categoryIds.some((id) => !assignableSpareCategoryIds.has(id)) ? (
                                    <p className="text-[10px] text-red-600 font-bold animate-pulse">
                                        * Please uncheck red-highlighted categories to save changes.
                                    </p>
                                ) : null
                            }
                        />

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Visible In
                            </label>
                            <div className="flex gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                {[
                                    { id: LISTING_TYPE.AD, label: "Device Ad Flow" },
                                    { id: LISTING_TYPE.SPARE_PART, label: "Spare Parts Marketplace" },
                                ].map((listingType) => (
                                    <label key={listingType.id} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary/20"
                                            checked={formData.listingType.includes(listingType.id as "ad" | "spare_part")}
                                            onChange={() => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    listingType: prev.listingType.includes(listingType.id as "ad" | "spare_part")
                                                        ? prev.listingType.filter((item) => item !== listingType.id)
                                                        : [...prev.listingType, listingType.id as "ad" | "spare_part"],
                                                }));
                                            }}
                                        />
                                        <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">
                                            {listingType.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {formData.listingType.length === 0 ? (
                                <p className="text-[10px] font-bold italic text-amber-600">
                                    * No visibility selected will hide this part from all workflows.
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                            <select
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={String(formData.isActive)}
                                onChange={(event) =>
                                    setFormData((prev) => ({ ...prev, isActive: event.target.value === "true" }))
                                }
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive (Hidden)</option>
                            </select>
                        </div>
                    </>
                );
            }}
        />

        <CatalogModal
            isOpen={!!deletingItem}
            onClose={() => setDeletingItem(null)}
            title="Delete Spare Part"
        >
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    Are you sure you want to delete <span className="font-bold text-slate-900">{deletingItem?.name}</span>?
                </p>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-red-900">
                        Cascade Delete Warning
                    </h4>
                    <p className="mt-1 text-sm text-red-700">
                        Any User Ads using this Master Part will lose their reference, but the ads themselves will not be deleted.
                    </p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        onClick={() => setDeletingItem(null)}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    >
                        Cancel
                    </button>
                    <button
                        autoFocus
                        onClick={async () => {
                            if (deletingItem) {
                                await handleDelete(deletingItem.id);
                                setDeletingItem(null);
                            }
                        }}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                        Yes, Delete It
                    </button>
                </div>
            </div>
        </CatalogModal>
        </>
    );
}

export default function SparePartsCatalogPage() {
    const searchParams = useSearchParams();
    const initialSearch = normalizeSearchParamValue(searchParams.get("search"));
    const initialCategoryId = normalizeCategoryParam(searchParams.get("categoryId"));
    const initialIsActive = normalizeActiveParam(searchParams.get("isActive"));
    const initialPage = parsePositiveIntParam(searchParams.get("page"), 1);

    return (
        <SparePartsCatalogPageContent
            key={`${initialSearch}:${initialCategoryId}:${initialIsActive}:${initialPage}`}
            initialSearch={initialSearch}
            initialCategoryId={initialCategoryId}
            initialIsActive={initialIsActive}
            initialPage={initialPage}
        />
    );
}
