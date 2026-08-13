"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Layers, CheckCircle, XCircle } from "@esparex/ui";
import { useAdminModels } from "@/hooks/useAdminModels";
import { useAdminBrands } from "@/hooks/useAdminBrands";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAssignableCategories } from "@/hooks/useAssignableCategories";
import { adminModelSchema } from "@/schemas/admin.schemas";
import { normalizeObjectIdLike } from "@/lib/utils/idUtils";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { normalizeSearchParamValue, parsePositiveIntParam } from "@/lib/urlSearchParams";
import { deriveCatalogLifecycleStatus, getEntityCategoryIds, hasCategoryOverlap, resolveModalAssignableCategoryState, toCategoryOptions, validateRequiredCategoryIds } from "@/components/catalog/catalogDomainUtils";
import { CatalogCategoryTags, CatalogEntityCell, CatalogEditDeleteActions, CatalogActiveToggleButton, CatalogActionsRow, CatalogActionIconButton, CatalogSearchInput, CatalogAsyncComboboxFilter } from "@/components/catalog/primitives";
import { Model } from "@esparex/contracts";
import type { ModelFormData } from "./types";
import { ModelsFormRenderer } from "./form";
import { CatalogDeleteModal } from "@/components/catalog/CatalogDeleteModal";
import { CatalogRejectModal } from "@/components/catalog/CatalogRejectModal";
import { useCatalogTabState } from "@/hooks/useCatalogTabState";

export default function ModelsTab() {
    const sp = useSearchParams();
    const initialSearch = normalizeSearchParamValue(sp.get("q") ?? sp.get("search"));
    const initialCategoryId = normalizeSearchParamValue(sp.get("categoryId")) || "all";
    const initialBrandId = normalizeSearchParamValue(sp.get("brandId")) || "all";
    const initialStatus = normalizeSearchParamValue(sp.get("status")) || "all";
    const initialPage = parsePositiveIntParam(sp.get("page"), 1);

    const { models, loading, error, handleDelete, handleCreate, handleUpdate, pagination, handleToggleStatus, handleApproveModel, handleRejectModel } = useAdminModels({
        initialFilters: { search: initialSearch, categoryId: initialCategoryId, brandId: initialBrandId, status: initialStatus },
        initialPagination: { page: initialPage, limit: 20 },
    });

    const {
        searchInput, setSearchInput,
        deletingItem: deletingModel, setDeletingItem: setDeletingModel,
        isDeleting, setIsDeleting, closeDelete,
        rejectingItem: rejectingModel, setRejectingItem: setRejectingModel,
        rejectionReason, setRejectionReason, isRejecting, setIsRejecting, closeReject, replaceQueryState
    } = useCatalogTabState<Model>({ 
        totalPages: pagination.totalPages, 
        loading,
        initialSearch,
        initialCategoryId,
        initialBrandId,
        initialStatus,
        initialPage
    });

    const confirmDelete = async () => { if (!deletingModel) return; setIsDeleting(true); const ok = await handleDelete(deletingModel.id); setIsDeleting(false); if (ok) setDeletingModel(null); };
    const confirmReject = async () => { if (!rejectingModel || !rejectionReason.trim()) return; setIsRejecting(true); await handleRejectModel(rejectingModel.id, rejectionReason.trim()); setIsRejecting(false); setRejectingModel(null); setRejectionReason(""); };

    const { brands } = useAdminBrands();
    const { categories } = useAdminCategories();
    const { assignableCategories, assignableCategoryIdSet } = useAssignableCategories(categories);
    const categoryOptions = toCategoryOptions(assignableCategories);
    const [archivedCategoryCount, setArchivedCategoryCount] = useState(0);

    const categoryFilterOptions = useMemo(() => categoryOptions.map((o) => ({ value: o.id, label: o.name })), [categoryOptions]);
    const brandFilterOptions = useMemo(() => brands.map((b) => ({ value: b.id, label: b.name })), [brands]);

    const filterRenderers = useMemo(() => [
        <CatalogSearchInput key="search" value={searchInput} placeholder="Search models..." onChange={setSearchInput} />,
        <CatalogAsyncComboboxFilter key="category" value={initialCategoryId} onChange={(cid) => replaceQueryState({ categoryId: cid !== "all" ? cid : null, brandId: null, page: null })} options={categoryFilterOptions} allLabel="All Categories" placeholder="Search categories..." />,
        <CatalogAsyncComboboxFilter key="brand" value={initialBrandId} onChange={(bid) => replaceQueryState({ brandId: bid !== "all" ? bid : null, page: null })} options={brandFilterOptions} allLabel="All Brands" placeholder="Search brands..." />,
        <CatalogAsyncComboboxFilter key="status" value={initialStatus} onChange={(s) => replaceQueryState({ status: s !== "all" ? s : null, page: null })} options={[{ value: "live", label: "Live Only" }, { value: "pending", label: "Pending Only" }, { value: "rejected", label: "Rejected Only" }]} allLabel="All Status" placeholder="Search status..." />,
    ], [brandFilterOptions, categoryFilterOptions, initialBrandId, initialCategoryId, initialStatus, replaceQueryState, searchInput]);

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
                    if (item) { const r = resolveModalAssignableCategoryState(item, assignableCategoryIdSet); setArchivedCategoryCount(r.archivedCategoryCount); setFormData({ name: item.name, brandId: normalizeObjectIdLike(item.brandId), categoryIds: r.assignableCategoryIds, parentModelId: null, variantOfModelId: null, isParentModel: false, isActive: item.isActive }); }
                    else { setArchivedCategoryCount(0); }
                }}
                generateColumns={(openEditModal) => [
                    { header: "Model", cell: (m) => <CatalogEntityCell icon={<Layers size={20} />} iconClassName="bg-blue-50 text-blue-600" title={m.name} /> },
                    { header: "Brand / Categories", cell: (m) => { const b = brands.find((br) => br.id === normalizeObjectIdLike(m.brandId)); return <div className="text-xs space-y-1.5"><div className="text-foreground font-bold">{b?.name || "Unknown Brand"}</div><CatalogCategoryTags categoryIds={getEntityCategoryIds(m)} categories={categories} /></div>; } },
                    { header: "Status", cell: (m) => <CatalogActiveToggleButton isActive={m.isActive} onClick={() => void handleToggleStatus(m.id)} /> },
                    { header: "Approval State", cell: (m) => { const ls = deriveCatalogLifecycleStatus(m); return <span className={`px-2 py-0.5 rounded text-tiny font-bold uppercase tracking-wider ${ls === 'active' ? "bg-emerald-100 text-emerald-700" : ls === 'pending' ? "bg-amber-100 text-amber-700" : ls === 'rejected' ? "bg-red-100 text-red-700" : "bg-slate-100 text-foreground-secondary"}`}>{ls}</span>; } },
                    { header: "Actions", className: "text-right", cell: (m) => { const ls = deriveCatalogLifecycleStatus(m); return <CatalogActionsRow>{ls === 'pending' && <><CatalogActionIconButton onClick={() => void handleApproveModel(m.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Approve" icon={<CheckCircle size={18} />} /><CatalogActionIconButton onClick={() => { setRejectionReason(""); setRejectingModel(m); }} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-all" title="Reject" icon={<XCircle size={18} />} /></>}<CatalogEditDeleteActions onEdit={() => openEditModal(m)} onDelete={() => setDeletingModel(m)} /></CatalogActionsRow>; } },
                ]}
                filterLayoutClassName="md:grid-cols-4"
                filtersRenderer={<>{filterRenderers}</>}
                formRenderer={(formData, setFormData, isEditing, editingItem) => (
                    <ModelsFormRenderer formData={formData} setFormData={setFormData} isEditing={isEditing} editingItem={editingItem ?? undefined} brands={brands} categoryOptions={categoryOptions} archivedCategoryCount={archivedCategoryCount} />
                )}
            />
            <CatalogDeleteModal
                isOpen={!!deletingModel}
                itemName={deletingModel?.name || ""}
                isDeleting={isDeleting}
                onClose={closeDelete}
                onConfirm={confirmDelete}
            />
            <CatalogRejectModal
                isOpen={!!rejectingModel}
                itemName={rejectingModel?.name || ""}
                reason={rejectionReason}
                isRejecting={isRejecting}
                onReasonChange={setRejectionReason}
                onClose={closeReject}
                onConfirm={confirmReject}
            />
        </>
    );
}
