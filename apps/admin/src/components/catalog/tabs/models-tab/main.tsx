"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GitBranch, Layers, CheckCircle, XCircle } from "lucide-react";
import { useAdminModels } from "@/hooks/useAdminModels";
import { useAdminBrands } from "@/hooks/useAdminBrands";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAssignableCategories } from "@/hooks/useAssignableCategories";
import { adminModelSchema } from "@/schemas/admin.schemas";
import { normalizeObjectIdLike } from "@/lib/utils/idUtils";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { useCatalogQueryStateSync } from "@/hooks/useCatalogQueryStateSync";
import { normalizeSearchParamValue, parsePositiveIntParam } from "@/lib/urlSearchParams";
import { deriveCatalogLifecycleStatus, getEntityCategoryIds, hasCategoryOverlap, resolveModalAssignableCategoryState, toCategoryOptions, validateRequiredCategoryIds } from "@/components/catalog/catalogDomainUtils";
import { CatalogCategoryTags, CatalogEntityCell, CatalogEditDeleteActions, CatalogActiveToggleButton, CatalogActionsRow, CatalogActionIconButton, CatalogSearchInput, CatalogAsyncComboboxFilter } from "@/components/catalog/CatalogUiPrimitives";
import { Model } from "@esparex/contracts";
import type { ModelFormData } from "./types";
import { useParentModelFetcher, useVariantModelFetcher } from "./hooks";
import { ModelsFormRenderer } from "./form";
import { ModelsDeleteModal } from "./delete-modal";
import { ModelsRejectModal } from "./reject-modal";

export default function ModelsTab() {
    const sp = useSearchParams();
    const initialSearch = normalizeSearchParamValue(sp.get("q") ?? sp.get("search"));
    const initialCategoryId = normalizeSearchParamValue(sp.get("categoryId")) || "all";
    const initialBrandId = normalizeSearchParamValue(sp.get("brandId")) || "all";
    const initialParentModelId = normalizeSearchParamValue(sp.get("parentModelId")) || "all";
    const initialVariantModelId = normalizeSearchParamValue(sp.get("variantModelId")) || "all";
    const initialStatus = normalizeSearchParamValue(sp.get("status")) || "all";
    const initialPage = parsePositiveIntParam(sp.get("page"), 1);
    const [searchInput, setSearchInput] = useState(initialSearch);

    const { models, loading, error, handleDelete, handleCreate, handleUpdate, pagination, handleToggleStatus, handleApproveModel, handleRejectModel } = useAdminModels({
        initialFilters: { search: initialSearch, categoryId: initialCategoryId, brandId: initialBrandId, parentModelId: initialParentModelId, variantModelId: initialVariantModelId, status: initialStatus },
        initialPagination: { page: initialPage, limit: 20 },
    });

    const [deletingModel, setDeletingModel] = useState<Model | null>(null);
    const [rejectingModel, setRejectingModel] = useState<Model | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    const confirmDelete = async () => { if (!deletingModel) return; setIsDeleting(true); const ok = await handleDelete(deletingModel.id); setIsDeleting(false); if (ok) setDeletingModel(null); };
    const confirmReject = async () => { if (!rejectingModel || !rejectionReason.trim()) return; setIsRejecting(true); await handleRejectModel(rejectingModel.id, rejectionReason.trim()); setIsRejecting(false); setRejectingModel(null); setRejectionReason(""); };

    const { brands } = useAdminBrands();
    const { categories } = useAdminCategories();
    const { assignableCategories, assignableCategoryIdSet } = useAssignableCategories(categories);
    const categoryOptions = toCategoryOptions(assignableCategories);
    const { replaceQueryState } = useCatalogQueryStateSync({ searchInput, initialSearch, loading, initialPage, totalPages: pagination.totalPages });
    const parentFetcher = useParentModelFetcher(initialBrandId, initialCategoryId, initialParentModelId);
    const variantFetcher = useVariantModelFetcher(initialBrandId, initialParentModelId);
    const [archivedCategoryCount, setArchivedCategoryCount] = useState(0);

    const categoryFilterOptions = useMemo(() => categoryOptions.map((o) => ({ value: o.id, label: o.name })), [categoryOptions]);
    const brandFilterOptions = useMemo(() => brands.map((b) => ({ value: b.id, label: b.name })), [brands]);
    const parentFilterOptions = useMemo(() => parentFetcher.options.map((m) => ({ value: m.id, label: m.name })), [parentFetcher.options]);
    const variantFilterOptions = useMemo(() => variantFetcher.options.map((m) => ({ value: m.id, label: m.name })), [variantFetcher.options]);
    const hierarchyModelNameById = useMemo(() => new Map([...models, ...parentFetcher.options, ...variantFetcher.options].flatMap((m) => m.id ? [[m.id, m.name] as const] : [])), [models, parentFetcher.options, variantFetcher.options]);

    const filterRenderers = useMemo(() => [
        <CatalogSearchInput key="search" value={searchInput} placeholder="Search models..." onChange={setSearchInput} />,
        <CatalogAsyncComboboxFilter key="category" value={initialCategoryId} onChange={(cid) => replaceQueryState({ categoryId: cid !== "all" ? cid : null, brandId: null, parentModelId: null, variantModelId: null, page: null })} options={categoryFilterOptions} allLabel="All Categories" placeholder="Search categories..." />,
        <CatalogAsyncComboboxFilter key="brand" value={initialBrandId} onChange={(bid) => replaceQueryState({ brandId: bid !== "all" ? bid : null, parentModelId: null, variantModelId: null, page: null })} options={brandFilterOptions} allLabel="All Brands" placeholder="Search brands..." />,
        <CatalogAsyncComboboxFilter key="parentModel" value={initialParentModelId} onChange={(pid) => replaceQueryState({ parentModelId: pid !== "all" ? pid : null, variantModelId: null, page: null })} options={parentFilterOptions} allLabel="All Parent Models" placeholder="Search parent models..." loading={parentFetcher.loading} onSearchChange={parentFetcher.setSearch} />,
        <CatalogAsyncComboboxFilter key="variant" value={initialVariantModelId} onChange={(vid) => replaceQueryState({ variantModelId: vid !== "all" ? vid : null, page: null })} options={variantFilterOptions} allLabel="All Variants" placeholder="Search variants..." disabled={initialParentModelId === "all"} loading={variantFetcher.loading} onSearchChange={variantFetcher.setSearch} />,
        <CatalogAsyncComboboxFilter key="status" value={initialStatus} onChange={(s) => replaceQueryState({ status: s !== "all" ? s : null, page: null })} options={[{ value: "live", label: "Live Only" }, { value: "pending", label: "Pending Only" }, { value: "rejected", label: "Rejected Only" }]} allLabel="All Status" placeholder="Search status..." />,
    ], [brandFilterOptions, categoryFilterOptions, initialBrandId, initialCategoryId, initialParentModelId, initialStatus, initialVariantModelId, parentFetcher.loading, parentFetcher.options, parentFilterOptions, replaceQueryState, searchInput, variantFetcher.loading, variantFetcher.options, variantFilterOptions]);

    return (
        <>
            <CatalogPageTemplate<Model, ModelFormData>
                isNested={true}
                title="Models Management"
                description="Manage device models."
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
                customSubmitValidation={(fd) => {
                    const ce = validateRequiredCategoryIds(fd.categoryIds); if (ce) return ce;
                    if (fd.categoryIds.length > 0) { const sb = brands.find((b) => b.id === fd.brandId); if (!hasCategoryOverlap(sb, fd.categoryIds)) return "Selected brand is not mapped to any of the selected categories"; }
                    return null;
                }}
                onModalOpen={(item, setFormData) => {
                    if (item) { const r = resolveModalAssignableCategoryState(item, assignableCategoryIdSet); setArchivedCategoryCount(r.archivedCategoryCount); setFormData({ name: item.name, brandId: normalizeObjectIdLike(item.brandId), categoryIds: r.assignableCategoryIds, parentModelId: normalizeObjectIdLike(item.parentModelId) || null, variantOfModelId: normalizeObjectIdLike(item.variantOfModelId) || null, isParentModel: Boolean(item.isParentModel), isActive: item.isActive }); }
                    else { setArchivedCategoryCount(0); }
                }}
                generateColumns={(openEditModal) => [
                    { header: "Model", cell: (m) => <CatalogEntityCell icon={<Layers size={20} />} iconClassName="bg-blue-50 text-blue-600" title={m.name} /> },
                    { header: "Brand / Categories", cell: (m) => { const b = brands.find((br) => br.id === normalizeObjectIdLike(m.brandId)); return <div className="text-xs space-y-1.5"><div className="text-slate-900 font-bold">{b?.name || "Unknown Brand"}</div><CatalogCategoryTags categoryIds={getEntityCategoryIds(m)} categories={categories} /></div>; } },
                    { header: "Hierarchy", cell: (m) => { const pid = normalizeObjectIdLike((m as any).parentModelId); const vid = normalizeObjectIdLike((m as any).variantOfModelId); const td = Number((m as any).treeDepth ?? 0); const oid = vid || pid; return <div className="flex min-w-0 items-start gap-2 text-xs text-slate-600"><GitBranch size={15} className="mt-0.5 shrink-0 text-slate-400" /><div className="min-w-0 space-y-1"><div className="font-semibold text-slate-800">{oid ? "Child model" : "Root model"} &middot; depth {td}</div>{oid ? <div className="truncate">{vid ? "Variant of" : "Parent"}: {hierarchyModelNameById.get(oid) ?? oid.slice(-6)}</div> : null}</div></div>; } },
                    { header: "Status", cell: (m) => <CatalogActiveToggleButton isActive={m.isActive} onClick={() => void handleToggleStatus(m.id)} /> },
                    { header: "Approval State", cell: (m) => { const ls = deriveCatalogLifecycleStatus(m); return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${ls === 'live' ? "bg-emerald-100 text-emerald-700" : ls === 'pending' ? "bg-amber-100 text-amber-700" : ls === 'rejected' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>{ls}</span>; } },
                    { header: "Actions", className: "text-right", cell: (m) => { const ls = deriveCatalogLifecycleStatus(m); return <CatalogActionsRow>{ls === 'pending' && <><CatalogActionIconButton onClick={() => void handleApproveModel(m.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Approve" icon={<CheckCircle size={18} />} /><CatalogActionIconButton onClick={() => { setRejectionReason(""); setRejectingModel(m); }} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-all" title="Reject" icon={<XCircle size={18} />} /></>}<CatalogEditDeleteActions onEdit={() => openEditModal(m)} onDelete={() => setDeletingModel(m)} /></CatalogActionsRow>; } },
                ]}
                filterLayoutClassName="md:grid-cols-6"
                filtersRenderer={<>{filterRenderers}</>}
                formRenderer={(formData, setFormData, isEditing, editingItem) => (
                    <ModelsFormRenderer formData={formData} setFormData={setFormData} isEditing={isEditing} editingItem={editingItem ?? undefined} brands={brands} categoryOptions={categoryOptions} parentModelOptions={parentFetcher.options} archivedCategoryCount={archivedCategoryCount} />
                )}
            />
            <ModelsDeleteModal model={deletingModel} isDeleting={isDeleting} onClose={() => setDeletingModel(null)} onConfirm={confirmDelete} />
            <ModelsRejectModal model={rejectingModel} reason={rejectionReason} isSubmitting={isRejecting} onReasonChange={setRejectionReason} onClose={() => setRejectingModel(null)} onConfirm={confirmReject} />
        </>
    );
}
