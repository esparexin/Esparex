"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tag, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useAdminBrands } from "@/hooks/useAdminBrands";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { categorySupportsAds, useAssignableCategories } from "@/hooks/useAssignableCategories";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { CatalogBoundNameCategoryFields } from "@/components/catalog/CatalogNameCategoryFields";
import { adminBrandSchema } from "@/schemas/admin.schemas";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { AdminApiError } from "@/lib/api/adminClient";
import { useCatalogQueryStateSync } from "@/hooks/useCatalogQueryStateSync";
import { normalizeSearchParamValue, parsePositiveIntParam } from "@/lib/urlSearchParams";
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
    CatalogSearchInput,
} from "@/components/catalog/CatalogUiPrimitives";
import type { Brand } from "@esparex/shared";

export default function BrandsTab() {
    const searchParams = useSearchParams();
    const initialSearch = normalizeSearchParamValue(searchParams.get("q") ?? searchParams.get("search"));
    const initialCategoryId = normalizeSearchParamValue(searchParams.get("categoryId")) || "all";
    const initialStatus = normalizeSearchParamValue(searchParams.get("status")) || "all";
    const initialPage = parsePositiveIntParam(searchParams.get("page"), 1);

    const [searchInput, setSearchInput] = useState(initialSearch);

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
        initialFilters: {
            search: initialSearch,
            categoryId: initialCategoryId,
            status: initialStatus,
        },
        initialPagination: {
            page: initialPage,
            limit: 50,
        },
    });

    const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
    const [rejectingBrand, setRejectingBrand] = useState<Brand | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
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

    const { replaceQueryState } = useCatalogQueryStateSync({
        searchInput,
        initialSearch,
        loading,
        initialPage,
        totalPages: pagination.totalPages,
    });

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
                                iconClassName="bg-orange-50 text-orange-600"
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
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
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
                                    <div className="text-xs font-medium text-slate-400">
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
                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                title="Approve"
                                                icon={<CheckCircle size={18} />}
                                            />
                                            <CatalogActionIconButton
                                                onClick={() => {
                                                    setRejectionReason("");
                                                    setRejectingBrand(brand);
                                                }}
                                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
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
                        <CatalogSearchInput
                            value={searchInput}
                            placeholder="Search brands..."
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

            <CatalogModal
                isOpen={!!deletingBrand}
                onClose={() => {
                    if (!isDeleting) {
                        setDeletingBrand(null);
                        setDeleteError(null);
                    }
                }}
                title="Delete Brand"
            >
                <div className="p-6 space-y-4">
                    {deleteError ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-2">
                            <div className="flex items-start gap-3">
                                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                                <div>
                                    <p className="text-sm font-semibold text-rose-800">
                                        Deletion Blocked (409 Conflict)
                                    </p>
                                    <p className="mt-1 text-sm text-rose-700">
                                        {deleteError.message}
                                    </p>
                                </div>
                            </div>
                            {deleteError.details && (
                                <div className="mt-2 pl-8 space-y-1">
                                    <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
                                        Active Dependencies:
                                    </p>
                                    <ul className="text-xs text-rose-700 list-disc list-inside space-y-1">
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
                        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                            <div>
                                <p className="text-sm font-semibold text-red-700">
                                    Cascade delete — this cannot be undone
                                </p>
                                <p className="mt-1 text-sm text-red-600">
                                    Deleting <strong>&ldquo;{deletingBrand?.name}&rdquo;</strong> will also 
                                    soft-delete all Models and Spare Parts linked exclusively to this brand.
                                </p>
                            </div>
                        </div>
                    )}
                    <p className="text-sm text-slate-600">
                        To hide this brand temporarily, <strong>deactivate it</strong> instead of deleting.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => {
                                setDeletingBrand(null);
                                setDeleteError(null);
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isDeleting || !!deleteError}
                            onClick={() => void confirmDelete()}
                            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                        >
                            {isDeleting ? (
                                <><Loader2 size={14} className="animate-spin" /> Deleting…</>
                            ) : (
                                "Yes, Delete Brand"
                            )}
                        </button>
                    </div>
                </div>
            </CatalogModal>

            <CatalogModal
                isOpen={!!rejectingBrand}
                onClose={() => !isRejecting && setRejectingBrand(null)}
                title="Reject Brand Application"
            >
                <CatalogRejectSuggestionForm
                    itemName={rejectingBrand?.name}
                    rejectionReason={rejectionReason}
                    onRejectionReasonChange={setRejectionReason}
                    onCancel={() => setRejectingBrand(null)}
                    onConfirm={() => void confirmReject()}
                    isSubmitting={isRejecting}
                    placeholder="e.g. Logo missing, Invalid category mapping..."
                />
            </CatalogModal>
        </>
    );
}
