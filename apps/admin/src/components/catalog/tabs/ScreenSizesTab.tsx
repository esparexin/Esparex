"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Monitor, AlertTriangle, Loader2 } from "@esparex/ui";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminScreenSizes } from "@/hooks/useAdminScreenSizes";
import { type ScreenSize } from "@/types/screenSize";
import { useAssignableCategories } from "@/hooks/useAssignableCategories";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { useCatalogTabState } from "@/hooks/useCatalogTabState";
import { CatalogDeleteModal } from "@/components/catalog/CatalogDeleteModal";
import { normalizeSearchParamValue, parsePositiveIntParam } from "@/lib/urlSearchParams";
import {
    CatalogActiveCheckboxField,
    CatalogActiveStatusFilter,
    CatalogActiveToggleButton,
    CatalogEditDeleteActions,
    CatalogEntityCell,
    CatalogSelectField,
    CatalogSelectFilter,
    CatalogTextInputField,
    CatalogSearchInput,
} from "@/components/catalog/primitives";
import { toCategoryOptions } from "@/components/catalog/catalogDomainUtils";
import type { ScreenSizeMutationPayload } from "@/lib/api/screenSizes";

export default function ScreenSizesTab() {
    const searchParams = useSearchParams();
    const initialSearch = normalizeSearchParamValue(searchParams.get("q") ?? searchParams.get("search"));
    const initialCategoryId = normalizeSearchParamValue(searchParams.get("categoryId")) || "all";
    const initialStatus = normalizeSearchParamValue(searchParams.get("status")) || "all";
    const initialPage = parsePositiveIntParam(searchParams.get("page"), 1);

    const { categories } = useAdminCategories();
    const {
        screenSizes,
        loading,
        error,
        pagination,
        handleDelete,
        handleCreate,
        handleUpdate,
        handleToggleStatus
    } = useAdminScreenSizes({
        initialFilters: {
            search: initialSearch,
            categoryId: initialCategoryId,
            status: initialStatus,
        },
        initialPagination: { page: 1, limit: 20 },
    });

    const {
        searchInput, setSearchInput,
        deletingItem: deletingScreenSize, setDeletingItem: setDeletingScreenSize,
        isDeleting, setIsDeleting, closeDelete, replaceQueryState
    } = useCatalogTabState<ScreenSize>({ 
        totalPages: pagination.totalPages, 
        loading,
        initialSearch,
        initialCategoryId,
        initialStatus,
        initialPage
    });


    const confirmDelete = async () => {
        if (!deletingScreenSize) return;
        setIsDeleting(true);
        const success = await handleDelete(deletingScreenSize.id);
        setIsDeleting(false);
        if (success) setDeletingScreenSize(null);
    };

    const { assignableCategories } = useAssignableCategories(
        categories,
        (cat) => cat.hasScreenSizes === true
    );
    const categoryOptions = toCategoryOptions(assignableCategories);

    return (
        <>
            <CatalogPageTemplate<ScreenSize, ScreenSizeMutationPayload>
                isNested={true}
                title="Screen Sizes"
                description="Manage screen-size master data by category."
                createLabel="Add Screen Size"
                csvFileName="screen-sizes.csv"
                items={screenSizes}
                loading={loading}
                error={error}
                pagination={pagination}
                setPage={(page) => replaceQueryState({ page: page > 1 ? page : null })}
                handleCreate={handleCreate}
                handleUpdate={handleUpdate}
                defaultFormData={{ size: "", name: "", value: 1, categoryId: "", isActive: true }}
                customSubmitValidation={(formData) => {
                    if (!formData.categoryId) return "Category is required";
                    return null;
                }}
                onModalOpen={(item, setFormData) => {
                    if (item) {
                        setFormData({
                            size: item.size,
                            name: item.name || "",
                            value: item.value,
                            categoryId: item.categoryId,
                            isActive: item.isActive,
                        });
                    }
                }}
                generateColumns={(openEditModal) => [
                    {
                        header: "Screen Size",
                        cell: (screenSize) => (
                            <CatalogEntityCell
                                icon={<Monitor size={20} />}
                                iconClassName="bg-sky-50 text-sky-600"
                                title={screenSize.size}
                                subtitle={screenSize.name}
                            />
                        ),
                    },
                    {
                        header: "Category",
                        cell: (screenSize) => {
                            const category = categories.find((cat) => cat.id === screenSize.categoryId);
                            return <span className="text-sm font-medium text-foreground-secondary">{category?.name || "Unknown"}</span>;
                        },
                    },
                    {
                        header: "Sort Order",
                        cell: (screenSize) => <span className="text-sm font-semibold text-foreground-secondary">{screenSize.value}</span>,
                    },
                    {
                        header: "Status",
                        cell: (screenSize) => (
                            <CatalogActiveToggleButton
                                isActive={screenSize.isActive}
                                onClick={() => void handleToggleStatus(screenSize.id)}
                            />
                        ),
                    },
                    {
                        header: "Actions",
                        className: "text-right",
                        cell: (screenSize) => (
                            <CatalogEditDeleteActions
                                onEdit={() => openEditModal(screenSize)}
                                onDelete={() => setDeletingScreenSize(screenSize)}
                            />
                        ),
                    },
                ]}
                filterLayoutClassName="md:grid-cols-3"
                filtersRenderer={
                    <>
                        <CatalogSearchInput
                            value={searchInput}
                            placeholder="Search screen sizes..."
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
                        <div className="grid grid-cols-2 gap-4">
                            <CatalogTextInputField
                                label="Size"
                                placeholder='e.g. 55"'
                                value={formData.size}
                                onChange={(size) => setFormData((prev) => ({ ...prev, size }))}
                            />
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground-tertiary uppercase tracking-wider">Sort Order</label>
                                <input
                                    required
                                    type="number"
                                    min={1}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={formData.value}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, value: Number(e.target.value) }))}
                                />
                            </div>
                        </div>

                        <CatalogTextInputField
                            label="Display Name (Optional)"
                            placeholder='e.g. 55" TV'
                            value={formData.name}
                            required={false}
                            onChange={(name) => setFormData((prev) => ({ ...prev, name }))}
                        />

                        <CatalogSelectField
                            label="Category"
                            placeholder="Select Category"
                            value={formData.categoryId}
                            options={categoryOptions.map((opt) => ({ value: opt.id, label: opt.name }))}
                            required
                            onChange={(categoryId) => setFormData((prev) => ({ ...prev, categoryId }))}
                        />

                        <CatalogActiveCheckboxField
                            checked={formData.isActive}
                            onChange={(isActive) => setFormData((prev) => ({ ...prev, isActive }))}
                        />
                    </>
                )}
            />

            <CatalogDeleteModal
                isOpen={!!deletingScreenSize}
                itemName={deletingScreenSize?.size || ""}
                isDeleting={isDeleting}
                onClose={closeDelete}
                onConfirm={confirmDelete}
            />
        </>
    );
}
