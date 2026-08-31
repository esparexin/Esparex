import { useState } from "react";
import { useCatalogQueryStateSync } from "@/hooks/useCatalogQueryStateSync";

interface UseCatalogTabStateOptions {
    defaultLimit?: number;
    totalPages: number;
    loading: boolean;
    initialSearch?: string;
    initialCategoryId?: string;
    initialBrandId?: string;
    initialStatus?: string;
    initialPage?: number;
}

export function useCatalogTabState<T extends { id: string }>({
    defaultLimit = 50,
    totalPages,
    loading,
    initialSearch = "",
    initialCategoryId = "all",
    initialBrandId = "all",
    initialStatus = "all",
    initialPage = 1,
}: UseCatalogTabStateOptions) {
    const [searchInput, setSearchInput] = useState(initialSearch);

    const [deletingItem, setDeletingItem] = useState<T | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [rejectingItem, setRejectingItem] = useState<T | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejecting, setIsRejecting] = useState(false);

    const { replaceQueryState } = useCatalogQueryStateSync({
        searchInput,
        initialSearch,
        loading,
        initialPage,
        totalPages,
    });

    const closeDelete = () => {
        if (!isDeleting) setDeletingItem(null);
    };

    const closeReject = () => {
        if (!isRejecting) setRejectingItem(null);
    };

    return {
        initialSearch,
        initialCategoryId,
        initialBrandId,
        initialStatus,
        initialPage,
        defaultLimit,

        searchInput,
        setSearchInput,

        deletingItem,
        setDeletingItem,
        isDeleting,
        setIsDeleting,
        closeDelete,

        rejectingItem,
        setRejectingItem,
        rejectionReason,
        setRejectionReason,
        isRejecting,
        setIsRejecting,
        closeReject,

        replaceQueryState
    };
}
