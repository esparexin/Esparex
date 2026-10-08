"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tag, CheckCircle, XCircle, AlertTriangle } from "@esparex/ui";
import { useAdminBrands } from "@/hooks/useAdminBrands";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { categorySupportsAds, useAssignableCategories } from "@/hooks/useAssignableCategories";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { CatalogBoundNameCategoryFields } from "@/components/catalog/CatalogNameCategoryFields";
import { adminBrandSchema } from "@/schemas/admin.schemas";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { AdminApiError } from "@/lib/api/adminClient";
import { useCatalogTabState } from "@/hooks/useCatalogTabState";
import { CatalogDeleteModal } from "@/components/catalog/CatalogDeleteModal";
import {
    deriveCatalogLifecycleStatus,
    getEntityCategoryIds,
    resolveModalAssignableCategoryState,
    toCategoryOptions,
} from "@/components/catalog/catalogDomainUtils";
import {
    CatalogActionsRow,
    CatalogActionIconButton,
    CatalogActiveCheckboxField,
    CatalogActiveToggleButton,
    CatalogArchivedCategoryNotice,
    CatalogCategoryTags,
    CatalogEntityCell,
    CatalogEditDeleteActionPair,
    CatalogSelectFilter,
    CatalogRejectSuggestionForm,
    CatalogSearchAndCategoryFilters,
} from "@/components/catalog/primitives";
import { normalizeSearchParamValue, parsePositiveIntParam } from "@/lib/urlSearchParams";

import { Brand } from "@esparex/contracts";

export default function BrandsTab() {
    const searchParams = useSearchParams();
    const initialSearch = normalizeSearchParamValue(searchParams.get("q") ?? searchParams.get("search"));
    const initialCategoryId = normalizeSearchParamValue(searchParams.get("categoryId")) || "all";
    const initialStatus = normalizeSearchParamValue(searchParams.get("status")) || "all";
    const initialPage = parsePositiveIntParam(searchParams.get("page"), 1);

    const {
        brands,
        loading,
        error,
        handleDelete,
        handleCreate,
        handleUpdate,
        pagination,
        handleToggleStatus,
        handleApprove,
        handleReject
    } = useAdminBrands({
        initialFilters: { search: initialSearch, categoryId: initialCategoryId, status: initialStatus },
        initialPagination: { page: initialPage, limit: 20 },
    });

    const {
        searchInput, setSearchInput,
        deletingItem: deletingBrand, setDeletingItem: setDeletingBrand,
        isDeleting, setIsDeleting, closeDelete,
        rejectingItem: rejectingBrand, setRejectingItem: setRejectingBrand,
        rejectionReason, setRejectionReason, isRejecting, setIsRejecting, closeReject,
        replaceQueryState
    } = useCatalogTabState<Brand>({ 
        totalPages: pagination.totalPages, 
        loading,
        initialSearch,
        initialCategoryId,
        initialStatus,
        initialPage
    });

    const [deleteError, setDeleteError] = useState<{
        message: string;
        details?: {
            models?: number;
            listings?: number;
            spareParts?: number;
            screenSizes?: number;
            smartAlerts?: number;
        };
    } | null>(null);

    const confirmDelete = async () => {
        if (!deletingBrand) return;
        setIsDeleting(true);
        setDeleteError(null);
        await handleDelete(deletingBrand.id, {
            onSuccess: () => {
                setDeletingBrand(null);
                setDeleteError(null);
                setIsDeleting(false);
            },
            onError: (error: unknown) => {
                setIsDeleting(false);
                if (error instanceof AdminApiError) {
                    const payload = error.payload;
                    setDeleteError({
                        message: payload.error || error.message || "Failed to delete brand.",
                        details: payload.details as {
                            models?: number;
                            listings?: number;
                            spareParts?: number;
                            screenSizes?: number;
                            smartAlerts?: number;
                        },
                    });
                } else {
                    setDeleteError({
                        message: error instanceof Error ? error.message : "An unexpected error occurred.",
                    });
                }
            }
        });
    };

    const confirmReject = async () => {
        if (!rejectingBrand || !rejectionReason.trim()) return;
        setIsRejecting(true);
        await handleReject(rejectingBrand.id, rejectionReason.trim());
        setIsRejecting(false);
        setRejectingBrand(null);
        setRejectionReason("");
    };

    const { categories } = useAdminCategories();
    const { assignableCategories, assignableCategoryIdSet } = useAssignableCategories(
        categories,
        categorySupportsAds
    );
    const categoryOptions = toCategoryOptions(assignableCategories);

    const [archivedCategoryCount, setArchivedCategoryCount] = useState(0);

    return (
        <>
            <CatalogPageTemplate<Brand, { name: string; categoryIds: string[]; isActive: boolean }>
                isNested={true}
                title="Brand Management"
                description="Manage product brands and their category assignments."
                createLabel="Add Brand"
                csvFileName="brands.csv"
                items={brands}
                loading={loading}
                error={error}
                pagination={pagination}
                setPage={(page) => replaceQueryState({ page: page > 1 ? page : null })}
                handleCreate={handleCreate}
                handleUpdate={handleUpdate}
                defaultFormData={{ name: "", categoryIds: [], isActive: true }}
                validationSchema={adminBrandSchema}
                onModalOpen={(item, setFormData) => {
                    if (item) {
                        const { assignableCategoryIds, archivedCategoryCount } = resolveModalAssignableCategoryState(
                            item,
                            assignableCategoryIdSet
                        );
                        setArchivedCategoryCount(archivedCategoryCount);
                        setFormData({
                            name: item.name,
                            categoryIds: assignableCategoryIds,
                            isActive: item.isActive,
                        });
                    } else {
                        setArchivedCategoryCount(0);
                    }
                }}
                generateColumns={(openEditModal) => [
                    {
                        header: "Brand",
                        cell: (brand) => (
                            <CatalogEntityCell
                                icon={<Tag size={20} />}
                                iconClassName="bg-warning/10 text-warning"
                                title={brand.name}
                            />
                        )
                    },
                    {
                        header: "Categories",
                        cell: (brand) => (
                            <CatalogCategoryTags
                                categoryIds={getEntityCategoryIds(brand)}
                                categories={categories}
                            />
                        )
                    },
                    {
                        header: "Status",
                        cell: (brand) => {
                            if (brand.isDeleted) {
                                return (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-tiny font-bold uppercase tracking-wider bg-muted text-foreground-secondary">
                                        Deleted
                                    </span>
                               );
                            }
                            return (
                                <CatalogActiveToggleButton
                                    isActive={brand.isActive}
                                    onClick={() => void handleToggleStatus(brand.id)}
                                />
                            );
                        }
                    },
                    {
                        header: "Actions",
                        className: "text-right",
                        cell: (brand) => {
                            const lifecycleStatus = deriveCatalogLifecycleStatus(brand);
                            if (brand.isDeleted) {
                                return (
                                    <div className="text-caption font-medium text-foreground-subtle">
                                        Hidden record
                                    </div>
                                );
                            }
                            return (
                                <CatalogActionsRow>
                                    {lifecycleStatus === 'pending' && (
                                        <>
                                            <CatalogActionIconButton
                                                onClick={() => void handleApprove(brand.id)}
                                                className="p-1.5 text-success hover:bg-success/10 rounded-lg transition-all"
                                                title="Approve"
                                                icon={<CheckCircle size={18} />}
                                            />
                                            <CatalogActionIconButton
                                                onClick={() => {
                                                    setRejectionReason("");
                                                    setRejectingBrand(brand);
                                                }}
                                                className="p-1.5 text-warning hover:bg-warning/10 rounded-lg transition-all"
                                                title="Reject"
                                                icon={<XCircle size={18} />}
                                            />
                                        </>
                                    )}
                                    <CatalogEditDeleteActionPair
                                        onEdit={() => openEditModal(brand)}
                                        onDelete={() => setDeletingBrand(brand)}
                                    />
                                </CatalogActionsRow>
                            );
                        }
                    }
                ]}
                filterLayoutClassName="md:grid-cols-3"
                filtersRenderer={
                    <>
                        <CatalogSearchAndCategoryFilters
                            searchValue={searchInput}
                            searchPlaceholder="Search brands..."
                            onSearchChange={setSearchInput}
                            categories={categoryOptions}
                            categoryValue={initialCategoryId}
                            onCategoryChange={(categoryId) =>
                                replaceQueryState({
                                    categoryId: categoryId !== "all" ? categoryId : null,
                                    page: null,
                                })
                            }
                        />
                        <CatalogSelectFilter
                            value={initialStatus}
                            onChange={(status) =>
                                replaceQueryState({
                                    status: status !== "all" ? status : null,
                                    page: null,
                                })
                            }
                            options={[
                                { value: "all", label: "All Status" },
                                { value: "live", label: "Live Only" },
                                { value: "inactive", label: "Inactive Only" },
                                { value: "pending", label: "Pending Only" },
                                { value: "rejected", label: "Rejected Only" },
                            ]}
                        />
                    </>
                }
                formRenderer={(formData, setFormData) => (
                    <>
                        <CatalogBoundNameCategoryFields
                            formData={formData}
                            setFormData={setFormData}
                            nameLabel="Brand Name"
                            namePlaceholder="e.g. Samsung"
                            categoryLabel="Assigned Categories"
                            categoryOptions={categoryOptions}
                            categoryNotice={
                                <CatalogArchivedCategoryNotice
                                    archivedCategoryCount={archivedCategoryCount}
                                    suffix="Select active categories and save to clean up the brand."
                                />
                            }
                        />
                        <CatalogActiveCheckboxField
                            checked={formData.isActive}
                            onChange={(isActive) => setFormData((prev) => ({ ...prev, isActive }))}
                            label="Active Status"
                        />
                    </>
                )}
            />

            <CatalogDeleteModal
                isOpen={!!deletingBrand}
                itemName={deletingBrand?.name || ""}
                isDeleting={isDeleting || !!deleteError}
                onClose={() => { closeDelete(); setDeleteError(null); }}
                onConfirm={confirmDelete}
                customContent={deleteError ? (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 space-y-2">
                        <div className="flex items-start gap-3">
                            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                            <div>
                                <p className="text-body font-semibold text-destructive">
                                    Deletion Blocked (409 Conflict)
                                </p>
                                <p className="mt-1 text-body text-destructive">
                                    {deleteError.message}
                                </p>
                            </div>
                        </div>
                        {deleteError.details && (
                            <div className="mt-2 pl-8 space-y-1">
                                <p className="text-caption font-semibold text-destructive uppercase tracking-wider">
                                    Active Dependencies:
                                </p>
                                <ul className="text-caption text-destructive list-disc list-inside space-y-1">
                                    {typeof deleteError.details.listings === "number" && deleteError.details.listings > 0 && (
                                        <li>Marketplace Listings: <strong>{deleteError.details.listings}</strong></li>
                                    )}
                                    {typeof deleteError.details.models === "number" && deleteError.details.models > 0 && (
                                        <li>Catalog Models: <strong>{deleteError.details.models}</strong></li>
                                    )}
                                    {typeof deleteError.details.spareParts === "number" && deleteError.details.spareParts > 0 && (
                                        <li>Spare Parts: <strong>{deleteError.details.spareParts}</strong></li>
                                    )}
                                    {typeof deleteError.details.screenSizes === "number" && deleteError.details.screenSizes > 0 && (
                                        <li>Screen Sizes: <strong>{deleteError.details.screenSizes}</strong></li>
                                    )}
                                    {typeof deleteError.details.smartAlerts === "number" && deleteError.details.smartAlerts > 0 && (
                                        <li>Smart Alerts: <strong>{deleteError.details.smartAlerts}</strong></li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                            <div>
                                <p className="text-body font-semibold text-destructive">
                                    Cascade delete — this cannot be undone
                                </p>
                                <p className="mt-1 text-body text-destructive">
                                    Deleting <strong>&ldquo;{deletingBrand?.name}&rdquo;</strong> will also 
                                    soft-delete all Models and Spare Parts linked exclusively to this brand.
                                </p>
                            </div>
                        </div>
                        <p className="text-body text-foreground-secondary">
                            To hide this brand temporarily, <strong>deactivate it</strong> instead of deleting.
                        </p>
                    </>
                )}
            />

            <CatalogModal
                isOpen={!!rejectingBrand}
                onClose={closeReject}
                title="Reject Brand Application"
            >
                <CatalogRejectSuggestionForm
                    itemName={rejectingBrand?.name}
                    rejectionReason={rejectionReason}
                    onRejectionReasonChange={setRejectionReason}
                    onCancel={closeReject}
                    onConfirm={() => void confirmReject()}
                    isSubmitting={isRejecting}
                    placeholder="e.g. Logo missing, Invalid category mapping..."
                />
            </CatalogModal>
        </>
    );
}
