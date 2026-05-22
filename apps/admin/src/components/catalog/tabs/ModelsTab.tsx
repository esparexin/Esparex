"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GitBranch, Layers, AlertTriangle, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useAdminModels } from "@/hooks/useAdminModels";
import { useAdminBrands } from "@/hooks/useAdminBrands";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAssignableCategories } from "@/hooks/useAssignableCategories";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { CatalogBoundNameCategoryFields } from "@/components/catalog/CatalogNameCategoryFields";
import { adminModelSchema } from "@/schemas/admin.schemas";
import { normalizeObjectIdLike } from "@/lib/utils/idUtils";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { useCatalogQueryStateSync } from "@/hooks/useCatalogQueryStateSync";
import { getModels } from "@/lib/api/models";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { normalizeSearchParamValue, parsePositiveIntParam } from "@/lib/urlSearchParams";
import {
    deriveCatalogLifecycleStatus,
    getEntityCategoryIds,
    hasCategoryOverlap,
    resolveModalAssignableCategoryState,
    toCategoryOptions,
    validateRequiredCategoryIds,
} from "@/components/catalog/catalogDomainUtils";
import {
    CatalogArchivedCategoryNotice,
    CatalogCategoryTags,
    CatalogEntityCell,
    CatalogEditDeleteActions,
    CatalogActiveToggleButton,
    CatalogSelectField,
    CatalogActionsRow,
    CatalogActionIconButton,
    CatalogRejectSuggestionForm,
    CatalogSearchInput,
    CatalogAsyncComboboxFilter,
} from "@/components/catalog/CatalogUiPrimitives";
import type { Model } from "@esparex/shared";

type ModelFormData = {
    name: string;
    brandId: string;
    categoryIds: string[];
    parentModelId?: string | null;
    variantOfModelId?: string | null;
    isParentModel?: boolean;
    isActive: boolean;
};

export default function ModelsTab() {
    const searchParams = useSearchParams();
    const initialSearch = normalizeSearchParamValue(searchParams.get("q") ?? searchParams.get("search"));
    const initialCategoryId = normalizeSearchParamValue(searchParams.get("categoryId")) || "all";
    const initialBrandId = normalizeSearchParamValue(searchParams.get("brandId")) || "all";
    const initialParentModelId = normalizeSearchParamValue(searchParams.get("parentModelId")) || "all";
    const initialVariantModelId = normalizeSearchParamValue(searchParams.get("variantModelId")) || "all";
    const initialStatus = normalizeSearchParamValue(searchParams.get("status")) || "all";
    const initialPage = parsePositiveIntParam(searchParams.get("page"), 1);

    const [searchInput, setSearchInput] = useState(initialSearch);

    const {
        models,
        loading,
        error,
        handleDelete,
        handleCreate,
        handleUpdate,
        pagination,
        handleToggleStatus,
        handleApproveModel,
        handleRejectModel
    } = useAdminModels({
        initialFilters: {
            search: initialSearch,
            categoryId: initialCategoryId,
            brandId: initialBrandId,
            parentModelId: initialParentModelId,
            variantModelId: initialVariantModelId,
            status: initialStatus,
        },
        initialPagination: {
            page: initialPage,
            limit: 20,
        },
    });

    const [deletingModel, setDeletingModel] = useState<Model | null>(null);
    const [rejectingModel, setRejectingModel] = useState<Model | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    const confirmDelete = async () => {
        if (!deletingModel) return;
        setIsDeleting(true);
        const success = await handleDelete(deletingModel.id);
        setIsDeleting(false);
        if (success) setDeletingModel(null);
    };

    const confirmReject = async () => {
        if (!rejectingModel || !rejectionReason.trim()) return;
        setIsRejecting(true);
        await handleRejectModel(rejectingModel.id, rejectionReason.trim());
        setIsRejecting(false);
        setRejectingModel(null);
        setRejectionReason("");
    };

    const { brands } = useAdminBrands();
    const { categories } = useAdminCategories();
    const { assignableCategories, assignableCategoryIdSet } = useAssignableCategories(categories);
    const categoryOptions = toCategoryOptions(assignableCategories);
    const { replaceQueryState } = useCatalogQueryStateSync({
        searchInput,
        initialSearch,
        loading,
        initialPage,
        totalPages: pagination.totalPages,
    });
    const [parentModelSearch, setParentModelSearch] = useState("");
    const [variantModelSearch, setVariantModelSearch] = useState("");
    const [parentModelOptions, setParentModelOptions] = useState<Model[]>([]);
    const [variantModelOptions, setVariantModelOptions] = useState<Model[]>([]);
    const [loadingParentModels, setLoadingParentModels] = useState(false);
    const [loadingVariantModels, setLoadingVariantModels] = useState(false);
    const parentRequestSeq = useRef(0);
    const variantRequestSeq = useRef(0);
    const parentOptionsCache = useRef(new Map<string, Model[]>());
    const variantOptionsCache = useRef(new Map<string, Model[]>());

    const categoryFilterOptions = useMemo(
        () => categoryOptions.map((opt) => ({ value: opt.id, label: opt.name })),
        [categoryOptions]
    );
    const brandFilterOptions = useMemo(
        () => brands.map((brand) => ({ value: brand.id, label: brand.name })),
        [brands]
    );
    const parentFilterOptions = useMemo(
        () => parentModelOptions.map((model) => ({ value: model.id, label: model.name })),
        [parentModelOptions]
    );
    const variantFilterOptions = useMemo(
        () => variantModelOptions.map((model) => ({ value: model.id, label: model.name })),
        [variantModelOptions]
    );
    const hierarchyModelNameById = useMemo(() => {
        const entries = [...models, ...parentModelOptions, ...variantModelOptions]
            .flatMap((model) => model.id ? [[model.id, model.name] as const] : []);
        return new Map(entries);
    }, [models, parentModelOptions, variantModelOptions]);

    useEffect(() => {
        const cacheKey = JSON.stringify({
            categoryId: initialCategoryId,
            brandId: initialBrandId,
            search: parentModelSearch.trim(),
        });
        const cached = parentOptionsCache.current.get(cacheKey);
        if (cached) {
            setParentModelOptions(cached);
            return;
        }

        const controller = new AbortController();
        const seq = parentRequestSeq.current + 1;
        parentRequestSeq.current = seq;
        setLoadingParentModels(true);

        void getModels({
            categoryId: initialCategoryId !== "all" ? initialCategoryId : undefined,
            brandId: initialBrandId !== "all" ? initialBrandId : undefined,
            search: parentModelSearch || undefined,
            treeView: true,
            page: 1,
            limit: 50,
        }, { signal: controller.signal })
            .then((response) => {
                if (controller.signal.aborted || seq !== parentRequestSeq.current) return;
                const items = parseAdminResponse<Model>(response).items;
                parentOptionsCache.current.set(cacheKey, items);
                setParentModelOptions(items);
            })
            .catch((error) => {
                if (!(error instanceof Error && error.name === "AbortError")) {
                    setParentModelOptions([]);
                }
            })
            .finally(() => {
                if (seq === parentRequestSeq.current) setLoadingParentModels(false);
            });

        return () => controller.abort();
    }, [initialBrandId, initialCategoryId, parentModelSearch]);

    useEffect(() => {
        if (initialParentModelId === "all") {
            setVariantModelOptions([]);
            return;
        }
        const cacheKey = JSON.stringify({
            brandId: initialBrandId,
            parentModelId: initialParentModelId,
            search: variantModelSearch.trim(),
        });
        const cached = variantOptionsCache.current.get(cacheKey);
        if (cached) {
            setVariantModelOptions(cached);
            return;
        }

        const controller = new AbortController();
        const seq = variantRequestSeq.current + 1;
        variantRequestSeq.current = seq;
        setLoadingVariantModels(true);

        void getModels({
            brandId: initialBrandId !== "all" ? initialBrandId : undefined,
            variantModelId: initialParentModelId,
            search: variantModelSearch || undefined,
            page: 1,
            limit: 50,
        }, { signal: controller.signal })
            .then((response) => {
                if (controller.signal.aborted || seq !== variantRequestSeq.current) return;
                const items = parseAdminResponse<Model>(response).items;
                variantOptionsCache.current.set(cacheKey, items);
                setVariantModelOptions(items);
            })
            .catch((error) => {
                if (!(error instanceof Error && error.name === "AbortError")) {
                    setVariantModelOptions([]);
                }
            })
            .finally(() => {
                if (seq === variantRequestSeq.current) setLoadingVariantModels(false);
            });

        return () => controller.abort();
    }, [initialBrandId, initialParentModelId, variantModelSearch]);

    const filterRenderers = useMemo(() => [
        <CatalogSearchInput
            key="search"
            value={searchInput}
            placeholder="Search models..."
            onChange={setSearchInput}
        />,
        <CatalogAsyncComboboxFilter
            key="category"
            value={initialCategoryId}
            onChange={(categoryId) =>
                replaceQueryState({
                    categoryId: categoryId !== "all" ? categoryId : null,
                    brandId: null,
                    parentModelId: null,
                    variantModelId: null,
                    page: null,
                })
            }
            options={categoryFilterOptions}
            allLabel="All Categories"
            placeholder="Search categories..."
        />,
        <CatalogAsyncComboboxFilter
            key="brand"
            value={initialBrandId}
            onChange={(brandId) =>
                replaceQueryState({
                    brandId: brandId !== "all" ? brandId : null,
                    parentModelId: null,
                    variantModelId: null,
                    page: null,
                })
            }
            options={brandFilterOptions}
            allLabel="All Brands"
            placeholder="Search brands..."
        />,
        <CatalogAsyncComboboxFilter
            key="parentModel"
            value={initialParentModelId}
            onChange={(parentModelId) =>
                replaceQueryState({
                    parentModelId: parentModelId !== "all" ? parentModelId : null,
                    variantModelId: null,
                    page: null,
                })
            }
            options={parentFilterOptions}
            allLabel="All Parent Models"
            placeholder="Search parent models..."
            loading={loadingParentModels}
            onSearchChange={setParentModelSearch}
        />,
        <CatalogAsyncComboboxFilter
            key="variant"
            value={initialVariantModelId}
            onChange={(variantModelId) =>
                replaceQueryState({
                    variantModelId: variantModelId !== "all" ? variantModelId : null,
                    page: null,
                })
            }
            options={variantFilterOptions}
            allLabel="All Variants"
            placeholder="Search variants..."
            disabled={initialParentModelId === "all"}
            loading={loadingVariantModels}
            onSearchChange={setVariantModelSearch}
        />,
        <CatalogAsyncComboboxFilter
            key="status"
            value={initialStatus}
            onChange={(status) =>
                replaceQueryState({
                    status: status !== "all" ? status : null,
                    page: null,
                })
            }
            options={[
                { value: "live", label: "Live Only" },
                { value: "pending", label: "Pending Only" },
                { value: "rejected", label: "Rejected Only" },
            ]}
            allLabel="All Status"
            placeholder="Search status..."
        />,
    ], [
        brandFilterOptions,
        categoryFilterOptions,
        initialBrandId,
        initialCategoryId,
        initialParentModelId,
        initialStatus,
        initialVariantModelId,
        loadingParentModels,
        loadingVariantModels,
        parentFilterOptions,
        replaceQueryState,
        searchInput,
        variantFilterOptions,
    ]);

    const [archivedCategoryCount, setArchivedCategoryCount] = useState(0);

    return (
        <>
            <CatalogPageTemplate<Model, ModelFormData>
                isNested={true}
                title="Models Management"
                description="Manage device models. Note: A model must be 'LIVE' (Approved) AND 'Active' (Visibility) to appear in the 'Post Ad' flow. Pending suggestions must be approved via the 'Check' icon before they become public."
                createLabel="Add Model"
                csvFileName="models.csv"
                items={models}
                loading={loading}
                error={error}
                pagination={pagination}
                setPage={(page) => replaceQueryState({ page: page > 1 ? page : null })}
                handleCreate={handleCreate}
                handleUpdate={handleUpdate}
                defaultFormData={{ name: "", brandId: "", categoryIds: [], parentModelId: null, variantOfModelId: null, isParentModel: false, isActive: true }}
                validationSchema={adminModelSchema}
                customSubmitValidation={(formData) => {
                    const categoryError = validateRequiredCategoryIds(formData.categoryIds);
                    if (categoryError) return categoryError;
                    if (formData.categoryIds.length > 0) {
                        const selectedBrand = brands.find((brand) => brand.id === formData.brandId);
                        if (!hasCategoryOverlap(selectedBrand, formData.categoryIds)) {
                            return "Selected brand is not mapped to any of the selected categories";
                        }
                    }
                    return null;
                }}
                onModalOpen={(item, setFormData) => {
                    if (item) {
                        const { assignableCategoryIds, archivedCategoryCount } = resolveModalAssignableCategoryState(
                            item,
                            assignableCategoryIdSet
                        );
                        setArchivedCategoryCount(archivedCategoryCount);
                        setFormData({
                            name: item.name,
                            brandId: normalizeObjectIdLike(item.brandId),
                            categoryIds: assignableCategoryIds,
                            parentModelId: normalizeObjectIdLike(item.parentModelId) || null,
                            variantOfModelId: normalizeObjectIdLike(item.variantOfModelId) || null,
                            isParentModel: Boolean(item.isParentModel),
                            isActive: item.isActive
                        });
                    } else {
                        setArchivedCategoryCount(0);
                    }
                }}
                generateColumns={(openEditModal) => [
                    {
                        header: "Model",
                        cell: (model) => (
                            <CatalogEntityCell
                                icon={<Layers size={20} />}
                                iconClassName="bg-blue-50 text-blue-600"
                                title={model.name}
                            />
                        )
                    },
                    {
                        header: "Brand / Categories",
                        cell: (model) => {
                            const brand = brands.find(b => b.id === normalizeObjectIdLike(model.brandId));
                            return (
                                <div className="text-xs space-y-1.5">
                                    <div className="text-slate-900 font-bold">{brand?.name || "Unknown Brand"}</div>
                                    <CatalogCategoryTags
                                        categoryIds={getEntityCategoryIds(model)}
                                        categories={categories}
                                    />
                                </div>
                            );
                        }
                    },
                    {
                        header: "Hierarchy",
                        cell: (model) => {
                            const parentId = normalizeObjectIdLike((model as Model & { parentModelId?: unknown }).parentModelId);
                            const variantOfId = normalizeObjectIdLike((model as Model & { variantOfModelId?: unknown }).variantOfModelId);
                            const treeDepth = Number((model as Model & { treeDepth?: unknown }).treeDepth ?? 0);
                            const ownerId = variantOfId || parentId;
                            return (
                                <div className="flex min-w-0 items-start gap-2 text-xs text-slate-600">
                                    <GitBranch size={15} className="mt-0.5 shrink-0 text-slate-400" />
                                    <div className="min-w-0 space-y-1">
                                        <div className="font-semibold text-slate-800">
                                            {ownerId ? "Child model" : "Root model"} · depth {treeDepth}
                                        </div>
                                        {ownerId ? (
                                            <div className="truncate">
                                                {variantOfId ? "Variant of" : "Parent"}: {hierarchyModelNameById.get(ownerId) ?? ownerId.slice(-6)}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        }
                    },
                    {
                        header: "Status",
                        cell: (model) => (
                            <CatalogActiveToggleButton
                                isActive={model.isActive}
                                onClick={() => void handleToggleStatus(model.id)}
                            />
                        )
                    },
                    {
                        header: "Approval State",
                        cell: (model) => {
                            const lifecycleStatus = deriveCatalogLifecycleStatus(model);
                            return (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${lifecycleStatus === 'live' ? "bg-emerald-100 text-emerald-700" :
                                    lifecycleStatus === 'pending' ? "bg-amber-100 text-amber-700" :
                                        lifecycleStatus === 'rejected' ? "bg-red-100 text-red-700" :
                                            "bg-slate-100 text-slate-700"
                                    }`}>
                                    {lifecycleStatus}
                                </span>
                            );
                        }
                    },
                    {
                        header: "Actions",
                        className: "text-right",
                        cell: (model) => {
                            const lifecycleStatus = deriveCatalogLifecycleStatus(model);
                            return (
                                <CatalogActionsRow>
                                    {lifecycleStatus === 'pending' && (
                                        <>
                                            <CatalogActionIconButton
                                                onClick={() => void handleApproveModel(model.id)}
                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                title="Approve"
                                                icon={<CheckCircle size={18} />}
                                            />
                                            <CatalogActionIconButton
                                                onClick={() => {
                                                    setRejectionReason("");
                                                    setRejectingModel(model);
                                                }}
                                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                                title="Reject"
                                                icon={<XCircle size={18} />}
                                            />
                                        </>
                                    )}
                                    <CatalogEditDeleteActions
                                        onEdit={() => openEditModal(model)}
                                        onDelete={() => setDeletingModel(model)}
                                    />
                                </CatalogActionsRow>
                            );
                        }
                    }
                ]}
                filterLayoutClassName="md:grid-cols-6"
                filtersRenderer={<>{filterRenderers}</>}
                formRenderer={(formData, setFormData, _isEditing, editingItem) => {
                    const formBrands = formData.categoryIds.length > 0
                        ? brands.filter((brand) => {
                            const brandCats = getEntityCategoryIds(brand);
                            return brandCats.some(cid => formData.categoryIds.includes(cid));
                        })
                        : brands;
                    const hierarchyOptions = parentModelOptions
                        .filter((model) => model.id !== editingItem?.id)
                        .filter((model) => !formData.brandId || normalizeObjectIdLike(model.brandId) === formData.brandId)
                        .map((model) => ({ value: model.id, label: model.name }));

                    return (
                        <>
                            <CatalogBoundNameCategoryFields
                                formData={formData}
                                setFormData={setFormData}
                                nameLabel="Model Name"
                                namePlaceholder="e.g. iPhone 15 Pro"
                                categoryLabel="Assigned Categories"
                                categoryOptions={categoryOptions}
                                categoryNotice={
                                    <CatalogArchivedCategoryNotice archivedCategoryCount={archivedCategoryCount} />
                                }
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <CatalogSelectField
                                    label="Brand"
                                    value={formData.brandId}
                                    onChange={(brandId: string) => setFormData((prev) => ({ ...prev, brandId, parentModelId: null, variantOfModelId: null }))}
                                    options={formBrands.map((brand) => ({ value: brand.id, label: brand.name }))}
                                    placeholder="Select Brand"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <CatalogSelectField
                                    label="Parent Model"
                                    value={formData.parentModelId || ""}
                                    onChange={(parentModelId: string) => setFormData((prev) => ({
                                        ...prev,
                                        parentModelId: parentModelId || null,
                                        variantOfModelId: null,
                                        isParentModel: parentModelId ? false : prev.isParentModel,
                                    }))}
                                    options={hierarchyOptions}
                                    placeholder="No parent model"
                                />
                                <CatalogSelectField
                                    label="Variant Of"
                                    value={formData.variantOfModelId || ""}
                                    onChange={(variantOfModelId: string) => setFormData((prev) => ({
                                        ...prev,
                                        variantOfModelId: variantOfModelId || null,
                                        parentModelId: variantOfModelId || prev.parentModelId || null,
                                        isParentModel: variantOfModelId ? false : prev.isParentModel,
                                    }))}
                                    options={hierarchyOptions}
                                    placeholder="Not a variant"
                                />
                            </div>
                            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                                    checked={Boolean(formData.isParentModel)}
                                    onChange={(event) => setFormData((prev) => ({ ...prev, isParentModel: event.target.checked }))}
                                    disabled={Boolean(formData.parentModelId || formData.variantOfModelId)}
                                />
                                Parent model
                            </label>
                        </>
                    );
                }}
            />

            <CatalogModal
                isOpen={!!deletingModel}
                onClose={() => !isDeleting && setDeletingModel(null)}
                title="Delete Model"
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                        <div>
                            <p className="text-sm font-semibold text-red-700">
                                Deletion is blocked when dependencies exist
                            </p>
                            <p className="mt-1 text-sm text-red-600">
                                <strong>&ldquo;{deletingModel?.name}&rdquo;</strong> cannot be deleted while it has child models,
                                variants, spare parts, listings, or active hierarchy references.
                            </p>
                        </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        <div className="font-semibold text-slate-900">Hierarchy impact preview</div>
                        <div className="mt-1 text-xs text-slate-600">
                            Parent: {normalizeObjectIdLike((deletingModel as (Model & { parentModelId?: unknown }) | null)?.parentModelId) ?? "None"} ·
                            Variant of: {normalizeObjectIdLike((deletingModel as (Model & { variantOfModelId?: unknown }) | null)?.variantOfModelId) ?? "None"} ·
                            Depth: {String((deletingModel as (Model & { treeDepth?: unknown }) | null)?.treeDepth ?? 0)}
                        </div>
                    </div>
                    <p className="text-sm text-slate-600">
                        To hide this model temporarily, <strong>deactivate it</strong> instead of deleting.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => setDeletingModel(null)}
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
                                "Delete If Safe"
                            )}
                        </button>
                    </div>
                </div>
            </CatalogModal>

            <CatalogModal
                isOpen={!!rejectingModel}
                onClose={() => !isRejecting && setRejectingModel(null)}
                title="Reject Model Suggestion"
            >
                <CatalogRejectSuggestionForm
                    itemName={rejectingModel?.name}
                    rejectionReason={rejectionReason}
                    onRejectionReasonChange={setRejectionReason}
                    onCancel={() => setRejectingModel(null)}
                    onConfirm={() => void confirmReject()}
                    isSubmitting={isRejecting}
                    placeholder="e.g. Duplicate entry, Invalid category, Spelled incorrectly..."
                />
            </CatalogModal>
        </>
    );
}
