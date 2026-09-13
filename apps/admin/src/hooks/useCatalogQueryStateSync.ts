"use client";

import { useAdminQuerySync, type UseAdminQuerySyncOptions } from "./useAdminQuerySync";

export type UseCatalogQueryStateSyncOptions = Required<
    Pick<UseAdminQuerySyncOptions, "searchInput" | "initialSearch" | "loading" | "initialPage" | "totalPages">
> &
    Pick<UseAdminQuerySyncOptions, "debounceMs">;

export function useCatalogQueryStateSync(options: UseCatalogQueryStateSyncOptions) {
    return useAdminQuerySync(options);
}
