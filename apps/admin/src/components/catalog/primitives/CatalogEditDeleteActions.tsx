"use client";

import { Edit, Trash2 } from "lucide-react";
import { CatalogActionIconButton, CatalogActionsRow } from "./CatalogActionsRow";

export function CatalogEditDeleteActions({
    onEdit,
    onDelete,
    editTitle = "Edit",
    deleteTitle = "Delete",
}: {
    onEdit: () => void;
    onDelete: () => void;
    editTitle?: string;
    deleteTitle?: string;
}) {
    return (
        <CatalogActionsRow>
            <CatalogEditDeleteActionPair onEdit={onEdit} onDelete={onDelete} editTitle={editTitle} deleteTitle={deleteTitle} />
        </CatalogActionsRow>
    );
}

export function CatalogEditDeleteActionPair({
    onEdit,
    onDelete,
    editTitle = "Edit",
    deleteTitle = "Delete",
}: {
    onEdit: () => void;
    onDelete: () => void;
    editTitle?: string;
    deleteTitle?: string;
}) {
    return (
        <>
            <CatalogActionIconButton onClick={onEdit} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title={editTitle} icon={<Edit size={18} />} />
            <CatalogActionIconButton onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title={deleteTitle} icon={<Trash2 size={18} />} />
        </>
    );
}
