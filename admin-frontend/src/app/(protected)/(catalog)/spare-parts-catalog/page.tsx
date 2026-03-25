"use client";

import { Wrench } from "lucide-react";

import { CatalogBoundNameCategoryFields } from "@/components/catalog/CatalogNameCategoryFields";
import {
    CatalogBoundSearchCategoryFilters,
    CatalogEditDeleteActions,
    CatalogEntityCell,
    CatalogSelectFilter,
    CatalogStatusBadge,
} from "@/components/catalog/CatalogUiPrimitives";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminSpareParts } from "@/hooks/useAdminSparePartCatalog";
import { useAssignableCategories } from "@/hooks/useAssignableCategories";
import { type ISparePartAdmin } from "@/types/sparePartCatalog";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import {
    buildSpareCategoryDisplayRows,
    getEntityCategoryIds,
    validateRequiredCategoryIds,
} from "@/components/catalog/catalogDomainUtils";

type SparePartFormData = {
    name: string;
    categoryIds: string[];
    listingType: string[];
    isActive: boolean;
};

export default function SparePartsCatalogPage() {
    const {
        parts,
        loading,
        error,
        filters,
        setFilters,
        handleDelete,
        handleCreate,
        handleUpdate,
        pagination,
        setPage,
    } = useAdminSpareParts();

    const { categories } = useAdminCategories({ initialPagination: { limit: 500 } });
    const {
        assignableCategories: assignableSpareCategories,
        assignableCategoryIdSet: assignableSpareCategoryIds,
    } = useAssignableCategories(categories, (category) => !!category.listingType?.includes("postsparepart"));

    return (
        <CatalogPageTemplate<ISparePartAdmin, SparePartFormData>
            title="Spare Parts Master"
            description="Global master list of spare parts — the SSOT for Post Ad Power-Off flow, spare parts marketplace, and repair service linking."
            createLabel="Add Master Part"
            csvFileName="spare-parts-catalog.csv"
            items={parts}
            loading={loading}
            error={error}
            pagination={pagination}
            setPage={setPage}
            handleCreate={handleCreate}
            handleUpdate={handleUpdate}
            defaultFormData={{ name: "", categoryIds: [], listingType: ["postsparepart"], isActive: true }}
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
                        listingType: item.listingType || ["postsparepart"],
                        isActive: item.isActive !== false,
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
                        <div className="flex flex-wrap gap-1 max-w-[300px]">
                            {part.categoryIds?.map((categoryId) => {
                                const category = categories.find((item) => item.id === categoryId);
                                const isInvalid = !assignableSpareCategoryIds.has(categoryId);
                                return (
                                    <span
                                        key={categoryId}
                                        className={`px-2 py-0.5 rounded text-[10px] border ${
                                            isInvalid
                                                ? "bg-red-50 text-red-600 border-red-100 font-bold"
                                                : "bg-slate-100 text-slate-600 border-slate-200"
                                        }`}
                                        title={isInvalid ? "This category is inactive or invalid for spare parts" : ""}
                                    >
                                        {category?.name || "Unknown"}
                                        {isInvalid ? " (!)" : ""}
                                    </span>
                                );
                            })}
                        </div>
                    ),
                },
                {
                    header: "Status",
                    cell: (part) => (
                        <CatalogStatusBadge
                            label={part.isActive ? "Active" : "Inactive (Hidden)"}
                            tone={part.isActive ? "success" : "neutral"}
                        />
                    ),
                },
                {
                    header: "Actions",
                    className: "text-right",
                    cell: (part) => (
                        <CatalogEditDeleteActions
                            onEdit={() => openEditModal(part)}
                            onDelete={() => void handleDelete(part.id)}
                        />
                    ),
                },
            ]}
            filterLayoutClassName="md:grid-cols-3"
            filtersRenderer={
                <>
                    <CatalogBoundSearchCategoryFilters
                        filters={filters}
                        setFilters={setFilters}
                        searchPlaceholder="Search parts catalog..."
                        categories={categories}
                    />
                    <CatalogSelectFilter
                        value={filters.isActive as string}
                        onChange={(isActive) => setFilters((prev) => ({ ...prev, isActive }))}
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
                                Placement (Workflows)
                            </label>
                            <div className="flex gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                {[
                                    { id: "postad", label: "Post Ad (Feature)" },
                                    { id: "postsparepart", label: "Inventory (Secondary)" },
                                ].map((listingType) => (
                                    <label key={listingType.id} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary/20"
                                            checked={formData.listingType.includes(listingType.id)}
                                            onChange={() => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    listingType: prev.listingType.includes(listingType.id)
                                                        ? prev.listingType.filter((item) => item !== listingType.id)
                                                        : [...prev.listingType, listingType.id],
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
                                    * No placement selected will hide this part from all workflows.
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
    );
}
