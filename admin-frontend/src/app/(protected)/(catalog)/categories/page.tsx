"use client";

import { Box, Briefcase, Edit, Smartphone, Trash2, Wrench } from "lucide-react";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { adminCategorySchema } from "@/schemas/admin.schemas";
import { type Category } from "@/types/category";
import { FORM_PLACEMENT_VALUES, type FormPlacement } from "@shared/enums/listingType";
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

export default function CategoriesPage() {
    const {
        categories,
        loading,
        error,
        filters,
        setFilters,
        handleToggleStatus,
        handleDelete,
        handleCreate,
        handleUpdate,
        pagination,
        setPage,
    } = useAdminCategories();

    const listingTypes = FORM_PLACEMENT_VALUES;

    return (
        <CatalogPageTemplate<Category, { name: string; isActive: boolean; hasScreenSizes: boolean; listingType: FormPlacement[]; _editingSlug?: string }>
            title="Categories"
            description="Root device categories — the SSOT for Post Ad step 1, search filters, alert matching, and fraud detection. Every brand, model, and spare part is anchored to a category here."
            createLabel="Add Category"
            csvFileName="categories.csv"
            items={categories}
            loading={loading}
            error={error}
            pagination={pagination}
            setPage={setPage}
            handleCreate={(data) => {
                const { _editingSlug, ...payload } = data;
                return handleCreate(payload);
            }}
            handleUpdate={(id, data) => {
                const { _editingSlug, ...payload } = data;
                return handleUpdate(id, payload as any);
            }}
            defaultFormData={{ name: "", isActive: true, hasScreenSizes: false, listingType: ["postad"], _editingSlug: "" }}
            customSubmitValidation={(formData) => {
                const slug = formData._editingSlug || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                const validation = adminCategorySchema.safeParse({ name: formData.name, slug });
                if (!validation.success) return validation.error.issues[0]?.message || "Invalid form data";
                if (formData.listingType.length === 0) return "At least one Listing Type is required";
                return null;
            }}
            onModalOpen={(item, setFormData) => {
                if (item) {
                    setFormData({
                        name: item.name,
                        isActive: item.isActive,
                        hasScreenSizes: item.hasScreenSizes || false,
                        listingType: Array.isArray(item.listingType)
                            ? item.listingType.filter((t): t is FormPlacement => listingTypes.includes(t as FormPlacement))
                            : [],
                        _editingSlug: item.slug
                    });
                }
            }}
            generateColumns={(openEditModal) => [
                {
                    header: "Category",
                    cell: (category) => (
                        <CatalogEntityCell
                            icon={getListingTypeIcon(category.listingType?.[0] || "", 20)}
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
                        value={filters.search}
                        placeholder="Search categories..."
                        onChange={(search) => setFilters((prev) => ({ ...prev, search }))}
                    />
                    <CatalogActiveStatusFilter
                        value={filters.status}
                        onChange={(status) => setFilters((prev) => ({ ...prev, status: status as any }))}
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
                        label="Listing Types (Placement)"
                        options={listingTypes.map((lt) => ({
                            value: lt,
                            label:
                                lt === "postad"
                                    ? "Post Ad (Devices)"
                                    : lt === "postservice"
                                        ? "Post Service"
                                        : "Post Spare Part",
                        }))}
                        selectedValues={formData.listingType}
                        onChange={(listingType) => setFormData((prev) => ({ ...prev, listingType: listingType as FormPlacement[] }))}
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
