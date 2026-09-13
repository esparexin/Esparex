import { useCallback } from "react";
import { type AdminResponseLike } from "@/hooks/useAdminCatalogCollection";

interface CatalogMutationOptions {
    approveFn?: (id: string) => Promise<AdminResponseLike>;
    rejectFn?: (id: string, reason: string) => Promise<AdminResponseLike>;
    toggleStatusFn?: (id: string) => Promise<AdminResponseLike>;
    deleteFn?: (id: string) => Promise<AdminResponseLike>;
    onApproveSuccess?: (id: string) => void | Promise<void>;
    onRejectSuccess?: (id: string) => void | Promise<void>;
    onToggleSuccess?: (id: string) => void | Promise<void>;
    onDeleteSuccess?: (id: string) => void | Promise<void>;
    fetchItems?: () => Promise<void> | void;
    runAction: (action: () => Promise<AdminResponseLike>, options: { successMessage: string; errorMessage: string; onSuccess?: () => Promise<void> | void }) => Promise<void | boolean>;
    entityName?: string;
}

export function useCatalogMutation({
    approveFn,
    rejectFn,
    toggleStatusFn,
    deleteFn,
    onApproveSuccess,
    onRejectSuccess,
    onToggleSuccess,
    onDeleteSuccess,
    fetchItems,
    runAction,
    entityName = "Item"
}: CatalogMutationOptions) {
    const handleApprove = useCallback(async (id: string) => {
        if (!approveFn) return;
        await runAction(() => approveFn(id), {
            successMessage: `${entityName} approved`,
            errorMessage: `Failed to approve ${entityName.toLowerCase()}`,
            onSuccess: () => {
                if (onApproveSuccess) onApproveSuccess(id);
                else if (fetchItems) void fetchItems();
            },
        });
    }, [approveFn, runAction, onApproveSuccess, fetchItems, entityName]);

    const handleReject = useCallback(async (id: string, reason: string) => {
        if (!rejectFn) return;
        await runAction(() => rejectFn(id, reason), {
            successMessage: `${entityName} rejected`,
            errorMessage: `Failed to reject ${entityName.toLowerCase()}`,
            onSuccess: () => {
                if (onRejectSuccess) onRejectSuccess(id);
                else if (fetchItems) void fetchItems();
            },
        });
    }, [rejectFn, runAction, onRejectSuccess, fetchItems, entityName]);

    const handleToggleStatus = useCallback(async (id: string) => {
        if (!toggleStatusFn) return;
        await runAction(() => toggleStatusFn(id), {
            successMessage: "Status updated",
            errorMessage: "Failed to toggle status",
            onSuccess: () => {
                if (onToggleSuccess) onToggleSuccess(id);
                else if (fetchItems) void fetchItems();
            },
        });
    }, [toggleStatusFn, runAction, onToggleSuccess, fetchItems]);

    const handleDelete = useCallback(async (id: string) => {
        if (!deleteFn) return;
        await runAction(() => deleteFn(id), {
            successMessage: `${entityName} deleted`,
            errorMessage: `Failed to delete ${entityName.toLowerCase()}`,
            onSuccess: () => {
                if (onDeleteSuccess) onDeleteSuccess(id);
                else if (fetchItems) void fetchItems();
            },
        });
    }, [deleteFn, runAction, onDeleteSuccess, fetchItems, entityName]);

    return {
        handleApprove,
        handleReject,
        handleToggleStatus,
        handleDelete,
    };
}
