"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CatalogIndexPage } from "@/components/catalog/CatalogIndexPage";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { catalogManagementTabs } from "@/components/layout/adminModuleTabSets";
import { ColumnDef } from "@/components/ui/DataTable";
import { useToast } from "@/context/ToastContext";
import { CatalogFormActions } from "@/components/catalog/CatalogFormActions";
import { z } from "zod";

export interface CatalogPageTemplateProps<TItem extends { id: string }, TFormData> {
    title: string;
    description: string;
    
    tabs?: import("@/components/layout/AdminModuleTabs").AdminTabItem[];
    
    items: TItem[];
    loading: boolean;
    error: string | null;
    
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages?: number;
    };
    setPage: (page: number) => void;
    
    handleCreate: (data: TFormData) => Promise<boolean | any>;
    handleUpdate: (id: string, data: TFormData | any) => Promise<boolean | any>;
    
    generateColumns: (openEditModal: (item: TItem) => void) => ColumnDef<TItem>[];
    filtersRenderer: React.ReactNode;
    filterLayoutClassName?: string;
    csvFileName: string;
    
    defaultFormData: TFormData;
    validationSchema?: z.ZodType<any, any>;
    formRenderer: (
        formData: TFormData,
        setFormData: React.Dispatch<React.SetStateAction<TFormData>>,
        isEditing: boolean,
        editingItem: TItem | null
    ) => React.ReactNode;
    customSubmitValidation?: (formData: TFormData) => string | null;
    
    onModalOpen?: (item: TItem | null, setFormData: React.Dispatch<React.SetStateAction<TFormData>>) => void;
    onModalClose?: () => void;
    
    createLabel?: string;
    modalTitleConfig?: { create: string; edit: string };
    emptyMessage?: string;
}

export function CatalogPageTemplate<TItem extends { id: string }, TFormData>({
    title,
    description,
    items,
    loading,
    error,
    pagination,
    setPage,
    handleCreate,
    handleUpdate,
    generateColumns,
    filtersRenderer,
    filterLayoutClassName,
    csvFileName,
    defaultFormData,
    validationSchema,
    formRenderer,
    customSubmitValidation,
    onModalOpen,
    onModalClose,
    createLabel = "Add Item",
    tabs,
    modalTitleConfig = { create: "Add New Item", edit: "Edit Item" },
    emptyMessage = "No items found"
}: CatalogPageTemplateProps<TItem, TFormData>) {
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<TItem | null>(null);
    const [formData, setFormData] = useState<TFormData>(defaultFormData);

    const closeModal = () => {
        setIsModalOpen(false);
        if (onModalClose) onModalClose();
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData(defaultFormData);
        setIsModalOpen(true);
        if (onModalOpen) onModalOpen(null, setFormData);
    };

    const openEditModal = (item: TItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
        if (onModalOpen) onModalOpen(item, setFormData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validationSchema) {
            const validation = validationSchema.safeParse(formData);
            if (!validation.success) {
                showToast(validation.error.issues[0]?.message || "Invalid form data", "error");
                return;
            }
        }

        if (customSubmitValidation) {
            const errorMsg = customSubmitValidation(formData);
            if (errorMsg) {
                showToast(errorMsg, "error");
                return;
            }
        }

        const success = editingItem
            ? await handleUpdate(editingItem.id, formData)
            : await handleCreate(formData);

        if (success) {
            closeModal();
        }
    };

    const columns = generateColumns(openEditModal);

    return (
        <CatalogIndexPage
            title={title}
            description={description}
            tabs={<AdminModuleTabs tabs={tabs || catalogManagementTabs} />}
            actions={
                <button
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    onClick={openCreateModal}
                >
                    <Plus size={18} />
                    {createLabel}
                </button>
            }
            filters={filtersRenderer}
            filterLayoutClassName={filterLayoutClassName}
            error={error}
            data={items}
            columns={columns}
            isLoading={loading}
            emptyMessage={emptyMessage}
            csvFileName={csvFileName}
            pagination={{
                currentPage: pagination.page,
                totalPages: pagination.totalPages || 1,
                totalItems: pagination.total,
                pageSize: pagination.limit,
                onPageChange: setPage
            }}
        >
            <CatalogModal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingItem ? modalTitleConfig.edit : modalTitleConfig.create}
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {formRenderer(formData, setFormData, !!editingItem, editingItem)}
                    
                    <CatalogFormActions
                        onCancel={closeModal}
                        isSubmitting={loading}
                        submitLabel={editingItem ? modalTitleConfig.edit.replace("Edit ", "Update ") : modalTitleConfig.create.replace("Add New ", "Create ")}
                    />
                </form>
            </CatalogModal>
        </CatalogIndexPage>
    );
}
