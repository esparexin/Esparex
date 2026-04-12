"use client";

import { useAdminBrands } from "@/hooks/useAdminBrands";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { Brand } from "@/types/brand";
import { categorySupportsAds, useAssignableCategories } from "@/hooks/useAssignableCategories";
import { Tag, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { CatalogBoundNameCategoryFields } from "@/components/catalog/CatalogNameCategoryFields";
import { adminBrandSchema } from "@/schemas/admin.schemas";
import { normalizeObjectIdLike } from "@/lib/utils/idUtils";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { useState } from "react";
import {
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
    CatalogBoundSearchCategoryFilters,
    CatalogCategoryTags,
    CatalogEntityCell,
    CatalogEditDeleteActionPair,
    CatalogSelectFilter,
} from "@/components/catalog/CatalogUiPrimitives";

export default function BrandsPage() {
    const {
        brands,
        loading,
        error,
        filters,
        setFilters,
        handleDelete,
        handleCreate,
        handleUpdate,
        pagination,
        setPage,
        handleToggleStatus,
        handleApprove,
        handleReject
    } = useAdminBrands();

    const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
    const [rejectingBrand, setRejectingBrand] = useState<Brand | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    const confirmDelete = async () => {
        if (!deletingBrand) return;
        setIsDeleting(true);
        const success = await handleDelete(deletingBrand.id);
        setIsDeleting(false);
        if (success) setDeletingBrand(null);
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
        <CatalogPageTemplate<Brand, { name: string; categoryIds: string[]; isActive: boolean; status: Brand['status'] }>
            title="Brand Management"
            description="Manage product brands and their category assignments."
            createLabel="Add Brand"
            csvFileName="brands.csv"
            items={brands}
            loading={loading}
            error={error}
            pagination={pagination}
            setPage={setPage}
            handleCreate={handleCreate}
            handleUpdate={handleUpdate}
            defaultFormData={{ name: "", categoryIds: [], isActive: true, status: "live" }}
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
                        status: item.status
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
                        if (brand.isDeleted) {
                            return (
                                <div className="text-xs font-medium text-slate-400">
                                    Hidden record
                                </div>
                            );
                        }
                        return (
                            <CatalogActionsRow>
                                {brand.status === 'pending' && (
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
                    <CatalogBoundSearchCategoryFilters
                        filters={filters}
                        setFilters={setFilters}
                        searchPlaceholder="Search brands..."
                        withCategoryFilterIcon
                        categories={categories}
                    />
                    <CatalogSelectFilter
                        value={filters.status}
                        onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
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
            onClose={() => !isDeleting && setDeletingBrand(null)}
            title="Delete Brand"
        >
            <div className="p-6 space-y-4">
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
                <p className="text-sm text-slate-600">
                    To hide this brand temporarily, <strong>deactivate it</strong> instead of deleting.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => setDeletingBrand(null)}
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
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                    <div>
                        <p className="text-sm font-semibold text-orange-700">
                            Rejection Action
                        </p>
                        <p className="mt-1 text-sm text-orange-600">
                            You are rejecting <strong>&ldquo;{rejectingBrand?.name}&rdquo;</strong>. 
                            Please provide a reason to notify the submitter.
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Rejection Reason
                    </label>
                    <textarea
                        autoFocus
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g. Logo missing, Invalid category mapping..."
                        className="w-full min-h-[100px] rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        disabled={isRejecting}
                        onClick={() => setRejectingBrand(null)}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={isRejecting || !rejectionReason.trim()}
                        onClick={() => void confirmReject()}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                        {isRejecting ? (
                            <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                        ) : (
                            "Confirm Rejection"
                        )}
                    </button>
                </div>
            </div>
        </CatalogModal>
        </>
    );
}
